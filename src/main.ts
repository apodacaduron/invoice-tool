import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import "./index.css";
import router from "./config/router";
import Theme from "@/config/theme";
import "primeicons/primeicons.css";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";
import ToastService from "primevue/toastservice";
import ConfirmationService from 'primevue/confirmationservice';

const pinia = createPinia();
const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Theme,
    options: {
      darkModeSelector: ".dark-mode",
    },
  },
});
app.use(router);
app.use(pinia);
app.use(VueQueryPlugin);
app.use(ToastService);
app.use(ConfirmationService);

app.mount("#app");
