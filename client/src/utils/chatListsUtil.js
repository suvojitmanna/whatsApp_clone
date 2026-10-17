export const DEFAULT_CHAT_LISTS = ["Favourites", "Communities"];

export const getAllLists = () => {
  try {
    const deletedDefaults = JSON.parse(
      localStorage.getItem("whatsapp_deleted_default_lists") || "[]",
    );
    const custom = JSON.parse(
      localStorage.getItem("whatsapp_all_custom_lists") || "[]",
    );
    const activeDefaults = DEFAULT_CHAT_LISTS.filter(
      (l) => !deletedDefaults.includes(l),
    );
    const combined = [...activeDefaults, ...custom];
    return Array.from(new Set(combined));
  } catch {
    return DEFAULT_CHAT_LISTS;
  }
};

export const createCustomList = (name) => {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  try {
    const deletedDefaults = JSON.parse(
      localStorage.getItem("whatsapp_deleted_default_lists") || "[]",
    );
    if (deletedDefaults.includes(trimmed)) {
      const updatedDeleted = deletedDefaults.filter((l) => l !== trimmed);
      localStorage.setItem(
        "whatsapp_deleted_default_lists",
        JSON.stringify(updatedDeleted),
      );
    }

    const all = getAllLists();
    if (all.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      return trimmed;
    }
    const custom = JSON.parse(
      localStorage.getItem("whatsapp_all_custom_lists") || "[]",
    );
    const updated = [...custom, trimmed];
    localStorage.setItem("whatsapp_all_custom_lists", JSON.stringify(updated));
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    return trimmed;
  } catch (e) {
    console.error("Error creating custom list:", e);
    return null;
  }
};

export const deleteCustomList = (name) => {
  const trimmed = (name || "").trim();
  const protectedLists = ["All", "Unread", "Favourites", "Favorites", "Groups"];
  if (!trimmed || protectedLists.includes(trimmed)) return false;
  try {
    const custom = JSON.parse(
      localStorage.getItem("whatsapp_all_custom_lists") || "[]",
    );
    const updated = custom.filter((l) => l !== trimmed);
    localStorage.setItem("whatsapp_all_custom_lists", JSON.stringify(updated));

    if (DEFAULT_CHAT_LISTS.includes(trimmed)) {
      const deletedDefaults = JSON.parse(
        localStorage.getItem("whatsapp_deleted_default_lists") || "[]",
      );
      if (!deletedDefaults.includes(trimmed)) {
        deletedDefaults.push(trimmed);
        localStorage.setItem(
          "whatsapp_deleted_default_lists",
          JSON.stringify(deletedDefaults),
        );
      }
    }

    const map = JSON.parse(
      localStorage.getItem("whatsapp_contact_lists") || "{}",
    );
    Object.keys(map).forEach((key) => {
      if (Array.isArray(map[key])) {
        map[key] = map[key].filter((l) => l !== trimmed);
      }
    });
    localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));

    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    return true;
  } catch (e) {
    console.error("Error deleting custom list:", e);
    return false;
  }
};

export const renameCustomList = (oldName, newName) => {
  const oldTrimmed = (oldName || "").trim();
  const newTrimmed = (newName || "").trim();
  const protectedLists = [
    "All",
    "Unread",
    "Favourites",
    "Favorites",
    "Groups",
    "Communities",
  ];
  if (!oldTrimmed || !newTrimmed || protectedLists.includes(oldTrimmed))
    return false;
  if (oldTrimmed === newTrimmed) return true;

  try {
    const custom = JSON.parse(
      localStorage.getItem("whatsapp_all_custom_lists") || "[]",
    );
    const updated = custom.map((l) => (l === oldTrimmed ? newTrimmed : l));
    localStorage.setItem(
      "whatsapp_all_custom_lists",
      JSON.stringify(Array.from(new Set(updated))),
    );

    const map = JSON.parse(
      localStorage.getItem("whatsapp_contact_lists") || "{}",
    );
    Object.keys(map).forEach((key) => {
      if (Array.isArray(map[key])) {
        map[key] = map[key].map((l) => (l === oldTrimmed ? newTrimmed : l));
      }
    });
    localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    return true;
  } catch (e) {
    console.error("Error renaming custom list:", e);
    return false;
  }
};

export const getContactListNames = (contact) => {
  if (!contact) return [];
  try {
    const map = JSON.parse(
      localStorage.getItem("whatsapp_contact_lists") || "{}",
    );
    const favs = JSON.parse(
      localStorage.getItem("whatsapp_favourite_chats") || "[]",
    );

    const convId = (
      contact.conversation?._id || contact.conversation
    )?.toString();
    const userId = (contact._id || contact.id)?.toString();

    const listSet = new Set();
    if (convId && map[convId]) {
      map[convId].forEach((l) => listSet.add(l));
    }
    if (userId && map[userId]) {
      map[userId].forEach((l) => listSet.add(l));
    }
    if (
      (convId && favs.includes(convId)) ||
      (userId && favs.includes(userId))
    ) {
      listSet.add("Favourites");
      listSet.add("Favorites");
    }
    return Array.from(listSet);
  } catch {
    return [];
  }
};

export const toggleContactList = (contact, listName) => {
  if (!contact || !listName) return [];
  try {
    const map = JSON.parse(
      localStorage.getItem("whatsapp_contact_lists") || "{}",
    );
    let favs = JSON.parse(
      localStorage.getItem("whatsapp_favourite_chats") || "[]",
    );

    const convId = (
      contact.conversation?._id || contact.conversation
    )?.toString();
    const userId = (contact._id || contact.id)?.toString();
    const key = convId || userId;
    if (!key) return [];

    const current = new Set(map[key] || []);
    if (userId && map[userId]) {
      map[userId].forEach((l) => current.add(l));
    }
    if (convId && map[convId]) {
      map[convId].forEach((l) => current.add(l));
    }

    if (listName === "Favourites" || listName === "Favorites") {
      const isFav =
        (convId && favs.includes(convId)) || (userId && favs.includes(userId));
      if (isFav) {
        favs = favs.filter((id) => id !== convId && id !== userId);
        current.delete("Favourites");
        current.delete("Favorites");
      } else {
        if (convId) favs.push(convId);
        else if (userId) favs.push(userId);
        current.add("Favourites");
        current.add("Favorites");
      }
      localStorage.setItem("whatsapp_favourite_chats", JSON.stringify(favs));
    } else {
      if (current.has(listName)) {
        current.delete(listName);
      } else {
        current.add(listName);
      }
    }

    const arr = Array.from(current);
    map[key] = arr;
    if (userId) map[userId] = arr;
    if (convId) map[convId] = arr;

    localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    return arr;
  } catch (e) {
    console.error("Error toggling contact list:", e);
    return [];
  }
};

export const isContactInList = (contact, listName) => {
  if (!contact || !listName || listName === "All") return true;

  if (listName === "Unread") {
    const unread = contact?.conversation?.unreadCount;
    return typeof unread === "number" && unread > 0;
  }

  if (listName === "Groups") {
    return Boolean(
      contact?.isGroup ||
      contact?.isGroupChat ||
      (contact?.conversation?.participants &&
        contact.conversation.participants.length > 2),
    );
  }

  if (listName === "Communities") {
    return Boolean(
      contact?.isCommunity ||
      contact?.isCommunityChat ||
      contact?.communityId ||
      getContactListNames(contact).includes("Communities"),
    );
  }

  const contactLists = getContactListNames(contact);
  if (listName === "Favourites" || listName === "Favorites") {
    return (
      contactLists.includes("Favourites") || contactLists.includes("Favorites")
    );
  }

  return contactLists.includes(listName);
};

export const updateListContacts = (
  listName,
  selectedContactIds,
  allContacts,
) => {
  if (!listName || !Array.isArray(allContacts)) return false;
  try {
    const map = JSON.parse(
      localStorage.getItem("whatsapp_contact_lists") || "{}",
    );
    let favs = JSON.parse(
      localStorage.getItem("whatsapp_favourite_chats") || "[]",
    );
    const idSet = new Set(selectedContactIds.map(String));

    allContacts.forEach((contact) => {
      const convId = (
        contact.conversation?._id || contact.conversation
      )?.toString();
      const userId = (contact._id || contact.id)?.toString();
      const isSelected =
        (userId && idSet.has(userId)) || (convId && idSet.has(convId));

      if (listName === "Favourites" || listName === "Favorites") {
        if (isSelected) {
          if (convId && !favs.includes(convId)) favs.push(convId);
          if (userId && !favs.includes(userId)) favs.push(userId);
        } else {
          favs = favs.filter((id) => id !== convId && id !== userId);
        }
      }

      [convId, userId].filter(Boolean).forEach((key) => {
        const cur = new Set(map[key] || []);
        if (isSelected) {
          cur.add(listName);
        } else {
          cur.delete(listName);
        }
        map[key] = Array.from(cur);
      });
    });

    if (listName === "Favourites" || listName === "Favorites") {
      localStorage.setItem("whatsapp_favourite_chats", JSON.stringify(favs));
    }
    localStorage.setItem("whatsapp_contact_lists", JSON.stringify(map));
    window.dispatchEvent(new Event("whatsapp_lists_changed"));
    return true;
  } catch (e) {
    console.error("Error updating list contacts:", e);
    return false;
  }
};
