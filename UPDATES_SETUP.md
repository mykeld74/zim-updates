# Updates Setup - Reading from Payload CMS

This site reads updates from your existing Payload CMS via its REST API.

## Environment Variable

Add your Payload CMS API URL to `.env`:

```bash
PAYLOAD_API_URL=https://your-payload-cms.com/api
```

If not set, it defaults to `http://localhost:3000/api`

## Expected Payload Collection

Your Payload CMS should have an `updates` collection with these fields:

- **id** - Unique identifier
- **title** - Post title
- **slug** - URL-friendly slug (unique)
- **excerpt** - Short description
- **content** - Rich text content
- **featuredImage** - Cloudinary public ID (optional)
- **author** - Author name
- **created_at** - Created timestamp
- **updated_at** - Updated timestamp

## Updates Routes

### `/updates` - Updates Listing

- Displays all published updates
- Grid layout with featured images
- Sorted by publishedDate (newest first)

### `/updates/[slug]` - Individual Update

- Full update content
- Featured image
- Author and date info
- Rich text rendering

## API Functions

Located in `/src/lib/server/updates.ts`:

- **`getPublishedPosts(limit)`** - Fetch published posts
- **`getPostBySlug(slug)`** - Fetch single post by slug
- **`getAllPosts()`** - Fetch all posts (including drafts)

## How It Works

The site fetches data from your Payload CMS REST API:

```
GET {PAYLOAD_API_URL}/updates?sort=-created_at&limit=10
```

No local Payload installation needed - just API calls to your existing Payload CMS.

## Testing Locally

If your Payload CMS is running locally on port 3000:

```bash
# In .env
PAYLOAD_API_URL=http://localhost:3000/api
```

Then visit:

- `http://localhost:5173/updates` - Updates listing
- `http://localhost:5173/updates/your-post-slug` - Individual update

## Production

Make sure:

1. Your Payload CMS API is publicly accessible (or accessible from your SvelteKit deployment)
2. Set `PAYLOAD_API_URL` environment variable in your deployment platform
3. Configure CORS on your Payload CMS if needed

## Cloudinary Images

For featured images, use Cloudinary public IDs in your Payload updates. The site will automatically render them using your existing Cloudinary setup.

