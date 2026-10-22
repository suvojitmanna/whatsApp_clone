export const isGroupSystemMessage = (msg) => {
  if (!msg) return false;
  if (msg.isSystemMessage === true) return true;
  if (msg.contentType === "system") return true;
  if (msg.systemAction) return true;
  const content = typeof msg.content === "string" ? msg.content.trim() : "";
  if (!content) return false;
  if (content.includes("\n")) return false;
  if (
    content.endsWith(" left the group") ||
    /^.+ added .+(, .+)*$/i.test(content) ||
    /^.+ removed .+$/i.test(content) ||
    /^Group ".*" created$/i.test(content)
  ) {
    return true;
  }
  return false;
};

export const getFormattedGroupSystemText = (msg, currentUserId, currentUserName) => {
  if (!msg) return "";
  let text = typeof msg.content === "string" ? msg.content.trim() : "";
  if (!text) return "";

  const senderId = (
    msg.sender?._id ||
    msg.sender?.id ||
    msg.sender
  )?.toString();
  const isSenderMe = Boolean(
    currentUserId && senderId && senderId === currentUserId.toString()
  );

  const createdMatch = text.match(/^Group "(.*)" created$/i);
  if (createdMatch) {
    return isSenderMe
      ? `You created group "${createdMatch[1]}"`
      : text;
  }

  if (text.endsWith(" left the group")) {
    const leaver = text.replace(/ left the group$/, "").trim();
    if (
      isSenderMe ||
      (currentUserName && leaver.toLowerCase() === currentUserName.toLowerCase())
    ) {
      return "You left the group";
    }
    return text;
  }

  if (/ added /i.test(text)) {
    const parts = text.split(/ added /i);
    if (parts.length === 2) {
      const actor = parts[0].trim();
      let targets = parts[1].trim();

      if (
        isSenderMe ||
        (currentUserName && actor.toLowerCase() === currentUserName.toLowerCase())
      ) {
        return `You added ${targets}`;
      }

      if (currentUserName) {
        const targetList = targets.split(", ").map((t) => {
          if (t.trim().toLowerCase() === currentUserName.toLowerCase()) {
            return "you";
          }
          return t;
        });
        targets = targetList.join(", ");
      }

      return `${actor} added ${targets}`;
    }
  }

  if (/ removed /i.test(text)) {
    const parts = text.split(/ removed /i);
    if (parts.length === 2) {
      const actor = parts[0].trim();
      let target = parts[1].trim();

      if (
        isSenderMe ||
        (currentUserName && actor.toLowerCase() === currentUserName.toLowerCase())
      ) {
        return `You removed ${target}`;
      }

      if (
        currentUserName &&
        target.toLowerCase() === currentUserName.toLowerCase()
      ) {
        target = "you";
      }

      return `${actor} removed ${target}`;
    }
  }

  return text;
};
