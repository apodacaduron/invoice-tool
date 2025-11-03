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
const selectedSeller = ref<{ id: number; info: string | null } | null>(null);

// --- Delete seller mutation ---
const deleteSellerMutation = useMutation({
  async mutationFn(sellerId?: number) {
    if (!sellerId) throw new Error("Seller ID not provided");
    const { error } = await supabase.from("sellers").delete().eq("id", sellerId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["sellers"] });
  },
  onSuccess: () => {
    toast.add({
      severity: "success",
      summary: "Seller deleted",
      detail: "Seller has been successfully removed.",
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
const sellersQuery = useInfiniteQuery({
  queryKey: ["sellers"],
  queryFn: async ({ pageParam = 0 }) => {
    const userId = session.value?.user.id
    if (!userId) return [];

    const { data, error } = await supabase
      .from("sellers")
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
        sellersQuery.hasNextPage.value &&
        !sellersQuery.isFetchingNextPage.value
      ) {
        sellersQuery.fetchNextPage();
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
function openActionsPopover(event: MouseEvent, seller: any) {
  selectedSeller.value = seller;
  nextTick(() => actionsPopoverRef.value?.show(event));
}

function confirmDelete(seller?: { id: number; info: string | null } | null) {
  if (!seller) return;
  confirm.require({
    message: `Are you sure you want to delete this seller?`,
    header: "Delete Seller",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Delete",
    rejectLabel: "Cancel",
    acceptProps: { severity: "danger" },
    accept: () => deleteSellerMutation.mutateAsync(seller.id),
  });
}
</script>

<template>
  <div class="max-w-[1295px] mx-auto px-4 lg:px-6 py-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Sellers</h2>
    </div>

    <!-- Sellers grid -->
    <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="seller in sellersQuery.data.value?.pages.flat()"
        :key="seller.id"
        class="bg-white dark:bg-neutral-800 shadow-md p-4 rounded-lg border dark:border-neutral-700 hover:shadow-lg transition"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">
              Seller #{{ seller.id }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
              {{ seller.info || "No info provided" }}
            </p>
          </div>
          <Button
            icon="pi pi-ellipsis-v"
            text
            @click="openActionsPopover($event, seller)"
          />
        </div>

        <p class="mt-3 text-xs text-gray-400">
          Added {{ new Date(seller.created_at).toLocaleDateString() }}
        </p>
      </div>
    </div>

    <!-- Infinite scroll sentinel -->
    <div ref="loadMoreRef" class="flex justify-center py-6 text-gray-500">
      <span v-if="sellersQuery.isFetchingNextPage.value">Loading more...</span>
      <span v-else-if="!sellersQuery.hasNextPage.value">No more sellers</span>
    </div>

    <!-- Popover actions -->
    <Popover ref="actionsPopoverRef">
      <div class="flex flex-col gap-2 w-[130px]">
        <div
          class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer text-red-500 rounded-border"
          @click="confirmDelete(selectedSeller)"
        >
          <i class="pi pi-trash" />
          <span>Delete</span>
        </div>
      </div>
    </Popover>
  </div>
</template>
