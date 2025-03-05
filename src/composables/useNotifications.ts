import { filters } from '../support.ts'
import axios from 'axios'
import { ref } from 'vue'

export function useNotifications() {
    const subscribers = ref([])
    const giftedSubscriptions = ref([])
    const cheers = ref([])
    const followers = ref([])
    const raids = ref([])

    const groupByUser = (events, eventType, mapFunction) => {
        return events
            .filter((notification: any) => notification.type === eventType)
            .map(mapFunction)
            .reduce((acc, item) => {
                const user = item.username ?? 'Anonymous'
                if (!acc[user]) {
                    acc[user] = []
                }
                acc[user].push(item)
                return acc
            }, {})
    }

    const fetchNotifications = async (dataRangeInHours: number = 24) => {
        console.log('Fetching event list...', {dataRangeInHours})
        const events = await queryEvents(filters, dataRangeInHours)

        subscribers.value = groupByUser(events, 'subscribe', (notification) => {
            return {username: notification.event.name}
        })

        giftedSubscriptions.value = groupByUser(events, 'gift-subscribe', (notification) => ({
            username: notification.event.gifter,
            amount: notification.event.amount,
        }))

        followers.value = groupByUser(events, 'follow', (notification) => {
            return {username: notification.event.name}
        })

        cheers.value = groupByUser(events, 'cheer', (notification) => ({
            username: notification.event.name,
            bits: notification.event.amount,
        }))

        raids.value = groupByUser(events, 'raid', (notification) => ({
            username: notification.event.name,
            viewers: notification.event.count,
        }))

        console.log({
            subscribers: subscribers.value,
            giftedSubscriptions: giftedSubscriptions.value,
            followers: followers.value,
            cheers: cheers.value,
            raids: raids.value,
        })
    }

    async function queryEvents(filters, dataRangeInHours = 24) {
        let page = 1
        let events = []
        const now = new Date()

        while (true) {
            const response = await axios.post('https://api.own3d.pro/v2/notifications', {
                'page': page,
                'platforms': ['twitch', 'own3d', 'youtube'],
                '_filters': filters,
            })

            const newEvents = response.data.data.filter(event => {
                const eventDate = new Date(event.created_at)
                const diffInMs = now - eventDate
                const diffInHours = diffInMs / 1000 / 60 / 60
                return diffInHours <= dataRangeInHours
            })

            events = events.concat(newEvents)

            if (newEvents.length < 30) {
                break
            }

            page++ // Move to the next page if we have 30 or more events
        }

        return events
    }


    return {
        fetchNotifications,
        subscribers,
        giftedSubscriptions,
        cheers,
        followers,
        raids,
    }

}