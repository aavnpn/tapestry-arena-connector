# Are.na Channel Connector for Tapestry

This connector pulls the most recent content — images, text, and links — from any **public Are.na channel** into Tapestry.

It fetches all blocks added to the channel, sorts them by when they were connected (not created), and renders them as rich media posts with proper annotations and authorship.

## Features

- Pulls up to 50 of the most recent blocks
- Supports **Text**, **Image**, and **Link** blocks
- Displays image attachments inline
- Annotates posts with the channel name (not slug)
- Uses the `connected_at` timestamp so recently added blocks show first — even if they're old

## Configuration

The connector prompts the user for an **Are.na Channel URL**, like: https://www.are.na/user/channel-name

## Notes

- This connector only works with **public** Are.na channels.
- Currently pulls up to 50 recent blocks for better performance.
