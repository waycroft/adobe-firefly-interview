# Tyler Termini — Image Manipulation via Adobe Firefly Services APIs

## Overview

The task was to create a web app using Firefly Services APIs which allowed the user to upload an image, apply at least three transformations, and view the transformed image.

My proposed design was a "profile image generator" which allowed you to:

- Upload an image of yourself
- Remove the background (using Photoshop API)
- Use Firefly API to perform a Generative Expand
- Apply miscellaneous Lightroom transformations, like Exposure, Contrast, and Saturation

### Status

Unfortunately the app is not fully functional as proposed. I had issues with both the Firefly and Lightroom APIs. But I am happy to discuss what happened, what I did, what I would plan to do in the future if this was a real project.

## Setup

1. Install [Bun](https://bun.sh) (a Node.js alternative server-side JS runtime)
2. Clone this repo
3. Run `bun install` or `bun i`
4. `touch .env` and paste in .env contents from Tyler
5. Open a terminal and run `bun dev` (this will run client and server using `concurrently`)
6. Open browser to `http://localhost:5173`
