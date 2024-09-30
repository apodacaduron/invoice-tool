import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from 'primevue/config';
import './index.css'
import router from "./config/router";
import Theme from '@/config/theme'
import 'primeicons/primeicons.css'

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Theme,
        options: {
            darkModeSelector: '.dark-mode',
        }
    }
 });

app.use(router)

app.mount('#app');

