import {onMounted, onUnmounted} from "vue";

export function useInterval(callback, delay) {
    let interval = null;

    onMounted(() => {
        interval = setInterval(() => {
            callback()
        }, delay)
    })

    onUnmounted(() => {
        if (interval) {
            clearInterval(interval);
        }
    })
}