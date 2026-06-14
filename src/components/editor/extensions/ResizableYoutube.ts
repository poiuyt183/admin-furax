import { ReactNodeViewRenderer } from "@tiptap/react";
import { Youtube } from "@tiptap/extension-youtube";
import YoutubeNodeView from "../components/YoutubeNodeView";

export const ResizableYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
      layout: {
        default: "full",
        parseHTML: (element) => element.getAttribute("data-layout") || "full",
        renderHTML: (attributes) => ({ "data-layout": attributes.layout }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView);
  },
});
