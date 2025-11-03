<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, toRef } from "vue";
import { supabase } from "@/config/supabase";
import { useAuthStatus } from "@/composables/useAuthStatus";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import Button from "primevue/button";
import Popover from "primevue/popover";

const { data: session } = useAuthStatus();
const toast = useToast();
const confirm = useConfirm();
const queryClient = useQueryClient();

const actionsPopoverRef = ref<{ show: (e: MouseEvent) => void; hide: () => void }>();
const selectedBuyer = ref<{ id: number; info: string | null } | null>(null);

// --- Delete buyer mutation ---
const deleteBuyerMutation = useMutation({
  async mutationFn(buyerId?: number) {
    if (!buyerId) throw new Error("Buyer ID not provided");
    const { error } = await supabase.from("buyers").delete().eq("id", buyerId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["buyers"] });
  },
  onSuccess: () => {
    toast.add({
      severity: "success",
      summary: "Buyer deleted",
      detail: "Buyer has been successfully removed.",
      life: 3000,
    });
  },
  onError: (error) => {
    toast.add({
      severity: "error",
      summary: "Error deleting",
      detail: (error as Error).message,
      life: 4000,
    });
  },
});

// --- Infinite query setup ---
const PAGE_SIZE = 12;
const buyersQuery = useInfiniteQuery({
  queryKey: ["buyers"],
  queryFn: async ({ pageParam = 0 }) => {
    const userId = session.value?.user.id
    if (!userId) return [];

    const { data, error } = await supabase
      .from("buyers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

    if (error) throw error;
    return data;
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages) => {
    if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
    return allPages.length;
  },
  enabled: toRef(() => Boolean(session.value)),
});

// --- Infinite scroll observer ---
const loadMoreRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        buyersQuery.hasNextPage.value &&
        !buyersQuery.isFetchingNextPage.value
      ) {
        buyersQuery.fetchNextPage();
      }
    },
    { threshold: 1 }
  );

  if (loadMoreRef.value) observer.observe(loadMoreRef.value);

  onUnmounted(() => {
    if (loadMoreRef.value) observer.unobserve(loadMoreRef.value);
  });
});

// --- Popover + Actions ---
function openActionsPopover(event: MouseEvent, buyer: any) {
  selectedBuyer.value = buyer;
  nextTick(() => actionsPopoverRef.value?.show(event));
}

function confirmDelete(buyer?: { id: number; info: string | null } | null) {
  if (!buyer) return;
  confirm.require({
    message: `Are you sure you want to delete this buyer?`,
    header: "Delete Buyer",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Delete",
    rejectLabel: "Cancel",
    acceptProps: { severity: "danger" },
    accept: () => deleteBuyerMutation.mutateAsync(buyer.id),
  });
}
</script>

<template>
  <div class="max-w-[1295px] mx-auto px-4 lg:px-6 py-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Buyers</h2>
    </div>

    <!-- Buyers grid -->
    <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="buyer in buyersQuery.data.value?.pages.flat()"
        :key="buyer.id"
        class="bg-white dark:bg-neutral-800 shadow-md p-4 rounded-lg border dark:border-neutral-700 hover:shadow-lg transition"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">
              Buyer #{{ buyer.id }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
              {{ buyer.info || "No info provided" }}
            </p>
          </div>
          <Button
            icon="pi pi-ellipsis-v"
            text
            @click="openActionsPopover($event, buyer)"
          />
        </div>

        <p class="mt-3 text-xs text-gray-400">
          Added {{ new Date(buyer.created_at).toLocaleDateString() }}
        </p>
      </div>
    </div>

    <!-- Infinite scroll sentinel -->
    <div ref="loadMoreRef" class="flex justify-center py-6 text-gray-500">
      <span v-if="buyersQuery.isFetchingNextPage.value">Loading more...</span>
      <span v-else-if="!buyersQuery.hasNextPage.value">No more buyers</span>
    </div>

    <!-- Popover actions -->
    <Popover ref="actionsPopoverRef">
      <div class="flex flex-col gap-2 w-[130px]">
        <div
          class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer text-red-500 rounded-border"
          @click="confirmDelete(selectedBuyer)"
        >
          <i class="pi pi-trash" />
          <span>Delete</span>
        </div>
      </div>
    </Popover>
  </div>
</template>
