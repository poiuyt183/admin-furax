import { PostFormSkeleton } from "@/features/posts/components/post-form-skeleton";

export default function EditPostLoading() {
  return (
    <div className="py-4">
      <PostFormSkeleton />
    </div>
  );
}
