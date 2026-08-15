import { create } from "zustand";
import { getSocket } from "../services/chatService";
import axiosInstance from "../services/url.services";

const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,
  error: null,

  //Active
  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  //Initilize the socket listeners
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("new_status", (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some(
          (status) => status._id === newStatus._id
        )
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    });

    socket.on("status_deleted", (statusId) => {
      set((state) => ({
        statuses: state.statuses.filter(
          (status) => status._id !== statusId
        ),
      }));
    });

    socket.on("status_viewed", ({ statusId, viewers }) => {
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId
            ? {
              ...status,
              viewers,
            }
            : status
        ),
      }));
    });
  },

  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("new_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  //Fetch Status
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.log("error fetched status", error);
      set({ error: error.message, loading: false });
    }
  },

  //Create Status
  createStatus: async (statusData) => {
    set({ loading: true, error: null });

    try {
      const formData = new FormData();
      if (statusData.media) {
        formData.append("media", statusData.media);
      }
      if (statusData.content?.trim()) {
        formData.append("content", statusData.content.trim());
      }
      const { data } = await axiosInstance.post("/status", formData);
      if (data.data) {
        set((state) => ({
          statuses: state.statuses.some(
            (s) => s._id === data.data._id
          )
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }

      set({ loading: false });
      return data.data;
    } catch (error) {
      console.log("STATUS CREATE ERROR:", error.response?.data);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  //view status
  viewStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.put(`status/${statusId}/view`);
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status } : status,
        ),
      }));
      set({ loading: false });
    } catch (error) {
      console.log({ error: error.message, loading: false });
    }
  },

  //deleteStatus
  deleteStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.delete(`status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
      set({ loading: false });
    } catch (error) {
      console.log("error Deleting status", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  //get status viewers
  getStatusViewer: async (statusId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axiosInstance.get(`status/${statusId}/viewers`);
      set({ loading: false });
      return data.data;
    } catch (error) {
      console.log("error getting status viewers", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  //helper function for group status
  getGroupStatus: () => {
    const { statuses } = get();

    return statuses.reduce((acc, status) => {
      const statusUserId = status.user?._id;

      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: status?.user?.username,
          avatar: status?.user?.profilePicture,
          statuses: [],
        };
      }

      acc[statusUserId].statuses.push({
        id: status._id,
        content: status.content,
        media: status.mediaUrl,
        contentType: status.contentType,
        timeStamp: status.createdAt,
        viewers: status.viewers || [],
      });

      return acc;
    }, {});
  },

  getUserStatuses: (userId) => {
    const groupedStatus = get().getGroupStatus();
    return userId ? groupedStatus[userId] : null;
  },

  getOtherStatuses: (userId) => {
    const groupedStatus = get().getGroupStatus();
    return Object.values(groupedStatus).filter(
      (contact) => contact.id !== userId,
    );
  },

  //clear error
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      statuses: [],
      loading: false,
      error: null,
    }),
}));

export default useStatusStore;
