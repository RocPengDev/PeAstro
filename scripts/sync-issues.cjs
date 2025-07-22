/**
 * GitHub Issues to Markdown Sync Script
 * 
 * This script automatically converts GitHub Issues into blog posts and about pages.
 * It's designed to work with GitHub Actions to automate content management.
 * 
 * Features:
 * - Converts issues to markdown files
 * - Extracts hero images from content
 * - Generates clean descriptions
 * - Supports both articles and about pages
 * - Handles tags and metadata
 * 
 * Usage:
 * - Run manually: node scripts/sync-issues.cjs
 * - Run via GitHub Actions: automatically triggered on issue events
 * 
 * Environment Variables:
 * - PERSONAL_TOKEN: GitHub personal access token
 * - GITHUB_REPOSITORY: Repository name (owner/repo)
 * - ISSUE_NUMBER: Issue number to process (optional, auto-detected in GitHub Actions)
 * 
 * @author PeAstro
 * @version 2.0.0
 */

const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Configuration
const TOKEN = process.env.PERSONAL_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const OUTPUT_DIR = 'src/content/articles';
const ABOUT_FILE = 'src/content/about/index.md';

// GitHub API headers
const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

/**
 * Convert string to URL-friendly slug
 * Handles both English and Chinese characters
 * @param {string} str - Input string to convert
 * @returns {string} URL-safe slug
 */
function toSlug(str) {
  return str.toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, function(match) { return encodeURIComponent(match); })
    .replace(/[^a-z0-9\u4e00-\u9fa5%]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Extract the first image URL from markdown content
 * Supports both markdown and HTML image syntax
 * @param {string} content - Markdown content to search
 * @returns {string|null} First image URL found, or null if none
 */
function extractFirstImage(content) {
  // Regular expression to match markdown image syntax: ![alt](url) or ![alt](url "title")
  const imageRegex = /!\[.*?\]\((.*?)(?:\s+".*?")?\)/;
  const match = content.match(imageRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Also check for HTML img tags
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const htmlMatch = content.match(htmlImageRegex);
  
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].trim();
  }
  
  return null;
}

function parseIssueBody(body) {
  const lines = body.split('\n');

  let title = '';
  let description = '';
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('title:')) {
      title = line.replace(/title:/i, '').trim();
    } else if (line.toLowerCase().startsWith('description:')) {
      description = line.replace(/description:/i, '').trim();
    } else if (line === '---') {
      contentStartIndex = i + 1;
      break;
    }
  }

  const content = lines.slice(contentStartIndex).join('\n').trim();
  
  // If no description provided, extract first 140 characters from content
  if (!description && content) {
    // Clean content for description: remove images, videos, links, and other markdown elements
    let cleanContent = content
      // Remove markdown images: ![alt](url) or ![alt](url "title")
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove HTML img tags
      .replace(/<img[^>]*>/gi, '')
      // Remove HTML video tags
      .replace(/<video[^>]*>.*?<\/video>/gi, '')
      // Remove HTML audio tags
      .replace(/<audio[^>]*>.*?<\/audio>/gi, '')
      // Remove markdown links but keep the text: [text](url) -> text
      .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
      // Remove HTML links but keep the text: <a href="url">text</a> -> text
      .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
      // Remove code blocks: ```code``` or `code`
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      // Remove markdown headers: ## Header -> Header
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove markdown lists markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove extra whitespace and newlines
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanContent) {
      description = cleanContent.substring(0, 140);
      if (cleanContent.length > 140) {
        description += '...';
      }
    }
  }
  
  // Extract first image as hero image
  const heroImage = extractFirstImage(content);
  
  return { title, description, content, heroImage };
}

function formatDateToYYYYMMDD(isoString) {
  const date = new Date(isoString);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatDateToISO(isoString) {
  const date = new Date(isoString);
  return date.toISOString(); // Keep full timestamp for sorting
}

function formatDateToFileName(isoString) {
  const date = new Date(isoString);
  return date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
}

function extractTags(labels) {
  return labels
    .map(label => label.name)
    .sort();
}

function hasLabel(labels, labelName) {
  return labels.some(label => label.name.toLowerCase() === labelName.toLowerCase());
}

function formatTags(tags) {
  if (tags.length === 0) return '[]';
  return `["${tags.join('", "')}"]`;
}

async function fetchCurrentIssue() {
  // Try to get issue number from various sources
  const issueNumber = process.env.ISSUE_NUMBER || 
                     process.env.GITHUB_EVENT_ISSUE_NUMBER ||
                     (process.env.GITHUB_EVENT_PATH && (() => {
                       try {
                         const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
                         return eventData.issue?.number;
                       } catch (e) {
                         return null;
                       }
                     })());
  
  if (!issueNumber) {
    throw new Error('Could not determine issue number. Please set ISSUE_NUMBER environment variable or run in GitHub Actions context.');
  }
  
  console.log(`Fetching issue #${issueNumber}...`);
  
  const response = await axios.get(`https://api.github.com/repos/${REPO}/issues/${issueNumber}`, {
    headers,
  });
  
  return response.data;
}


async function run() {
  console.log('Starting GitHub Issue sync...');
  
  try {
    const issue = await fetchCurrentIssue();
    console.log(`Processing issue #${issue.number}: "${issue.title}"`);
    
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`Created output directory: ${OUTPUT_DIR}`);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Check if issue has draft label - skip if it does
    const labels = issue.labels || [];
    if (hasLabel(labels, 'draft')) {
      console.log(`Skipping issue #${issue.number} (draft label found)`);
      console.log('\n--- Sync Summary ---');
      console.log(`Issue #${issue.number} skipped (draft)`);
      console.log('No files were created or updated.');
      return;
    }

    // Process the issue
    const { title, description, content, heroImage } = parseIssueBody(issue.body || '');
    const finalTitle = title || issue.title || 'Untitled';
    const pubDate = formatDateToISO(issue.created_at);
    const updatedDate = issue.updated_at !== issue.created_at ? formatDateToISO(issue.updated_at) : null;
    const tags = extractTags(labels);

    // Check if this is an about issue by labels
    if (hasLabel(labels, 'about')) {
      // Handle about issue - write to about/index.md
      const aboutDir = path.dirname(ABOUT_FILE);
      if (!fs.existsSync(aboutDir)) {
        fs.mkdirSync(aboutDir, { recursive: true });
      }

      const aboutMd = `---
title: "${finalTitle}"
description: "${description}"
pubDate: "${pubDate}"${updatedDate ? `\nupdatedDate: "${updatedDate}"` : ''}${heroImage ? `\nheroImage: "${heroImage}"` : ''}
tags: ${formatTags(tags)}
---

${content}
`;

      const aboutExists = fs.existsSync(ABOUT_FILE);
      let shouldUpdateAbout = true;
      
      if (aboutExists) {
        const existingContent = fs.readFileSync(ABOUT_FILE, 'utf8');
        if (existingContent === aboutMd) {
          console.log(`Skipped (unchanged): about/index.md`);
          skippedCount++;
          shouldUpdateAbout = false;
        }
      }

      if (shouldUpdateAbout) {
        fs.writeFileSync(ABOUT_FILE, aboutMd);
        if (aboutExists) {
          console.log(`Updated: about/index.md`);
          updatedCount++;
        } else {
          console.log(`Created: about/index.md`);
          createdCount++;
        }
      }
    } else {
      // Handle regular article issue
      const datePrefix = formatDateToFileName(issue.created_at);
      const fileName = `${datePrefix}-${issue.number}.md`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      const md = `---
title: "${finalTitle}"
description: "${description}"
pubDate: "${pubDate}"${updatedDate ? `\nupdatedDate: "${updatedDate}"` : ''}${heroImage ? `\nheroImage: "${heroImage}"` : ''}
tags: ${formatTags(tags)}
draft: false
featured: false
---

${content}
`;

      // Always overwrite if file exists (as requested)
      const fileExists = fs.existsSync(filePath);
      
      fs.writeFileSync(filePath, md);
      if (fileExists) {
        console.log(`Updated: ${fileName}`);
        updatedCount++;
      } else {
        console.log(`Created: ${fileName}`);
        createdCount++;
      }
    }

    console.log('\n--- Sync Summary ---');
    console.log(`Issue #${issue.number} processed:`);
    console.log(`Created: ${createdCount} files`);
    console.log(`Updated: ${updatedCount} files`);
    console.log(`Skipped: ${skippedCount} files`);
    console.log('Sync completed successfully!');
    
  } catch (error) {
    console.error('Error during sync:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

run().catch(console.error);
