import './index.css';
import 'primeicons/primeicons.css';

import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';

import Theme from '@/config/theme';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';
import router from './config/router';

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Theme,
    options: {
      darkModeSelector: ".dark",
    },
  },
});
app.use(router);
app.use(VueQueryPlugin);
app.use(ToastService);
app.use(ConfirmationService);

app.mount("#app");
