import { type PlasmoMessaging } from "@plasmohq/messaging"
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { url, options } = req.body

    if (options.isFormData) {

      const formData = new FormData();
      for (const { field, data } of options.body) {
        formData.append(field, data);
      }
      options.body = formData;
    }

    console.log("Background received request:", JSON.stringify(options), url)

    // Perform the fetch request
    const response = await fetch(url, {
      method: options?.method || 'GET',
      credentials: 'include',
      ...options
    })

    // Parse response based on content type
    let data
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Send successful response back to popup
    res.send({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data
    })

  } catch (error) {
    // Send error response back to popup
    res.send({
      success: false,
      error: error.message
    })
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  // Rule to remove the Origin header from all requests
  const rule = {
    id: 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: 'origin',
          operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE
        }
      ]
    },
    condition: {
      urlFilter: '*', // Apply to all URLs
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME
      ]
    }
  };

  // Add the rule
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1], // Remove existing rule with ID 1
    addRules: [rule]
  });

  console.log('DNR rule added to remove Origin header');
});

export default handler
