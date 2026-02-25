export const n8nService = {
    async triggerJobPosted(jobData: any) {
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_JOB_WEBHOOK
        if (!webhookUrl) {
            console.warn('N8N_JOB_WEBHOOK is not set')
            return
        }

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobData),
            })
        } catch (error) {
            console.error('Failed to trigger n8n job webhook:', error)
        }
    },

    async triggerApplicationSubmitted(applicationData: any) {
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_APPLICATION_WEBHOOK
        if (!webhookUrl) {
            console.warn('N8N_APPLICATION_WEBHOOK is not set')
            return
        }

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationData),
            })
        } catch (error) {
            console.error('Failed to trigger n8n application webhook:', error)
        }
    },
}
