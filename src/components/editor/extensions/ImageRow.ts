import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageRowView from "../components/ImageRowView";

export interface ImageRowImage {
  src: string;
  alt: string;
  width?: number; // percentage width
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageRow: {
      insertImageRow: (columns: number) => ReturnType;
    };
  }
}

export const ImageRow = Node.create({
  name: "imageRow",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute("data-images") || "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          "data-images": JSON.stringify(attributes.images),
        }),
      },
      columns: {
        default: 2,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-columns") || "2", 10),
        renderHTML: (attributes) => ({
          "data-columns": String(attributes.columns),
        }),
      },
      height: {
        default: 192,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-height") || "192", 10),
        renderHTML: (attributes) => ({
          "data-height": String(attributes.height),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-row"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "image-row" }),
    ];
  },

  addCommands() {
    return {
      insertImageRow:
        (columns: number) =>
        ({ commands }) => {
          const images: ImageRowImage[] = Array.from(
            { length: columns },
            () => ({
              src: "",
              alt: "",
            }),
          );
          return commands.insertContent({
            type: this.name,
            attrs: { columns, images },
          });
        },
    };
  },

  // addNodeView() {
  //   return ReactNodeViewRenderer(ImageRowView);
  // },
});
