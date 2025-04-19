function verify() {
  const slug = channelUrl.substring(channelUrl.lastIndexOf('/') + 1);
  const apiUrl = `https://api.are.na/v2/channels/${slug}`;

  sendRequest(apiUrl)
    .then((responseText) => {
      const data = JSON.parse(responseText);
      const displayName = data.title || slug;
      processVerification({ displayName });
    })
    .catch((error) => {
      processError(error);
    });
}

function load() {
  const slug = channelUrl.substring(channelUrl.lastIndexOf('/') + 1);
  const perPage = 100;
  const maxItems = 50;
  const seenIds = new Set();
  let allBlocks = [];

  const channelUrlApi = `https://api.are.na/v2/channels/${slug}`;

  sendRequest(channelUrlApi)
    .then((channelResponse) => {
      const channelData = JSON.parse(channelResponse);
      const displayName = channelData.title || slug;

      let page = 1;

      function fetchNextPage() {
        const apiUrl = `${channelUrlApi}?page=${page}&per=${perPage}`;
        console.log(`📡 Fetching page ${page}: ${apiUrl}`);

        sendRequest(apiUrl)
          .then((responseText) => {
            const data = JSON.parse(responseText);
            const blocks = data.contents || [];

            if (blocks.length === 0) {
              return finish();
            }

            for (const block of blocks) {
              if (!["Image", "Text", "Link"].includes(block.class)) continue;
              if (seenIds.has(block.id)) continue;

              seenIds.add(block.id);
              allBlocks.push(block);
            }

            page++;
            fetchNextPage();
          })
          .catch((error) => processError(error));
      }

      function finish() {
        // ✅ Sort by most recent connection to this channel
        allBlocks.sort((a, b) => {
          const aDate = new Date(a.connected_at || a.created_at);
          const bDate = new Date(b.connected_at || b.created_at);
          return bDate - aDate;
        });

        const latestBlocks = allBlocks.slice(0, maxItems);
        const results = [];

        for (const block of latestBlocks) {
          const blockDate = new Date(block.connected_at || block.created_at || block.updated_at);
          const uri = `https://www.are.na/block/${block.id}`;
          const item = Item.createWithUriDate(uri, blockDate);

          let body = "";
          const attachments = [];

          if (block.class === "Text") {
            body = block.content_html || `<p>${block.content}</p>`;
          } else if (block.class === "Image") {
            if (block.description_html) {
              body = block.description_html;
            } else if (block.description) {
              body = `<p>${block.description}</p>`;
            }

            const imageUrl = block.image?.original?.url || block.image?.display?.url;
            if (imageUrl) {
              const attachment = MediaAttachment.createWithUrl(imageUrl);
              if (block.image.content_type) {
                attachment.mimeType = block.image.content_type;
              }
              attachments.push(attachment);
            }
          } else if (block.class === "Link") {
            if (block.title) body += `<p>${block.title}</p>`;
            if (block.description_html) {
              body += block.description_html;
            } else if (block.description) {
              body += `<p>${block.description}</p>`;
            }
            if (block.source?.url) {
              body += `<p><a href="${block.source.url}">${block.source.url}</a></p>`;
            }

            const imageUrl = block.image?.original?.url || block.image?.display?.url;
            if (imageUrl) {
              const attachment = MediaAttachment.createWithUrl(imageUrl);
              if (block.image.content_type) {
                attachment.mimeType = block.image.content_type;
              }
              attachments.push(attachment);
            }
          }

          item.body = body;
          if (attachments.length > 0) {
            item.attachments = attachments;
          }

          if (block.user) {
            const user = block.user;
            const name =
              user.full_name ||
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.slug;
            const identity = Identity.createWithName(name);
            identity.uri = `https://www.are.na/${user.slug}`;
            if (user.avatar_image?.display) {
              identity.avatar = user.avatar_image.display;
            }
            item.author = identity;
          }

          const annotation = Annotation.createWithText(`From ${displayName}`);
          annotation.icon = "https://www.are.na/favicon.ico";
          annotation.uri = channelUrl;
          item.annotations = [annotation];

          results.push(item);
        }

        console.log(`🎉 Returning ${results.length} most recent items`);
        processResults(results);
      }

      fetchNextPage();
    })
    .catch((error) => processError(error));
}
