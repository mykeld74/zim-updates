# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Cloudinary setup

Set the following environment variables:

```
# server-side
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# client-side
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Server config lives in `src/lib/server/cloudinary.ts`. Client URL helper is in `src/lib/cloudinary.ts`. Example usage on the home page uses `CloudinaryImage.svelte`.

Docs: [Cloudinary MCP & LLM-friendly docs](https://cloudinary.com/documentation/cloudinary_llm_mcp#llms_txt)
