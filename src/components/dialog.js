import { createApp } from 'vue'
import Dialog from "./dialog.vue";

export default({ title, content, onCancel, onConfirm }) => {
    const mountNode = document.createElement('div')
    const instance = createApp(Dialog, {
        title,
        modelValue: true,
        contentBody: content,
        onCancel: () => {
            instance.unmount(mountNode);
            document.body.removeChild(mountNode);
            onCancel && onCancel()
        },
        onConfirm: async () => {
            if (onConfirm) {
                await onConfirm()
            }
            instance.unmount(mountNode);
            document.body.removeChild(mountNode);
        }
    })

    document.body.appendChild(mountNode)
    instance.mount(mountNode)
    // 显示dialog loading
    instance.showLoading = () => {
        instance._instance.exposed.showLoading()
    };
    // 关闭dialog loading
    instance.hideLoading = () => {
        instance._instance.exposed.hideLoading()
    }
    return instance
}
