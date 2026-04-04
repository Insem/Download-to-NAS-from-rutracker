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

    console.log("Background received request:", JSON.stringify(options))
    const response = await fetch(url, {
      method: options?.method || 'GET',
      credentials: 'include',
      ...options
    })

    let data
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    res.send({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data
    })

  } catch (error) {
    res.send({
      success: false,
      error: error.message
    })
  }
}

export default handler
