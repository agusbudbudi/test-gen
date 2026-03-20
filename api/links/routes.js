import express from 'express';
import axios from 'axios';
import connectDB from '../dashboard/db.js';
import Link from './models/Link.js';

export const linksRouter = express.Router();

// Get all links
linksRouter.get('/', async (req, res) => {
  try {
    await connectDB();
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Add a new link
linksRouter.post('/', async (req, res) => {
  try {
    await connectDB();
    const link = new Link(req.body);
    await link.save();
    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Update a link
linksRouter.put('/:id', async (req, res) => {
  try {
    await connectDB();
    const link = await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// Delete a link
linksRouter.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    const link = await Link.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Parse URL metadata
linksRouter.post('/parse', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 10000 });
    const html = response.data;
    
    // Extract title
    let title = '';
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || 
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    else if (titleTagMatch) title = titleTagMatch[1];

    // Extract description
    let description = '';
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (ogDescMatch) description = ogDescMatch[1];
    else if (metaDescMatch) description = metaDescMatch[1];

    // Extract image
    let imageUrl = '';
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) imageUrl = ogImageMatch[1];

    // Clean up entities simply
    const decodeEntities = (str) => {
      if (!str) return str;
      return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    };
    
    title = decodeEntities(title);
    description = decodeEntities(description);

    // Handle relative image urls
    if (imageUrl && imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
    }

    res.json({ title: title && title.trim() ? title : url, description: description || '', imageUrl: imageUrl || '' });
  } catch (error) {
    console.error('Parse error:', error.message);
    res.json({ title: url, description: '', imageUrl: '' }); // Fallback on error
  }
});
