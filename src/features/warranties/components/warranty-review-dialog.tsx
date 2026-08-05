"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneDisplay } from "@/lib/phone";
import type { WarrantyRow } from "./warranty-columns";

type WarrantyReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: WarrantyRow | null;
  onApprove: (adminNote?: string) => void;
  onReject: (adminNote?: string) => void;
  isLoading?: boolean;
};

export function WarrantyReviewDialog({
  open,
  onOpenChange,
  warranty,
  onApprove,
  onReject,
  isLoading,
}: WarrantyReviewDialogProps) {
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (open) {
      setAdminNote(warranty?.adminNote ?? "");
    }
  }, [open, warranty?.adminNote]);

  if (!warranty) return null;

  const pending = warranty.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu bảo hành</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin khách hàng và xác nhận kích hoạt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Trạng thái</span>
            <Badge
              variant={
                warranty.status === "APPROVED"
                  ? "default"
                  : warranty.status === "REJECTED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {warranty.status === "APPROVED"
                ? "Đã kích hoạt"
                : warranty.status === "REJECTED"
                  ? "Từ chối"
                  : "Chờ duyệt"}
            </Badge>
          </div>

          <div className="grid gap-3 rounded-lg border p-4">
            <div>
              <p className="text-muted-foreground">Khách hàng</p>
              <p className="font-medium">{warranty.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Số điện thoại</p>
              <p className="font-medium">
                {formatPhoneDisplay(warranty.customerPhone)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Địa chỉ</p>
              <p className="font-medium whitespace-pre-wrap">
                {warranty.customerAddress}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sản phẩm</p>
              <p className="font-medium">{warranty.productName}</p>
              <p className="text-muted-foreground">
                Mã: {warranty.productSku ?? "—"}
                {warranty.product.warranty
                  ? ` · BH: ${warranty.product.warranty}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày gửi</p>
              <p className="font-medium">
                {format(new Date(warranty.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {warranty.endsAt && (
              <div>
                <p className="text-muted-foreground">Hạn bảo hành</p>
                <p className="font-medium">
                  {format(new Date(warranty.endsAt), "dd/MM/yyyy")}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-note">Ghi chú nội bộ (tuỳ chọn)</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Lý do từ chối hoặc ghi chú duyệt..."
              disabled={!pending || isLoading}
              className="min-h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {pending ? (
            <>
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={() => onReject(adminNote.trim() || undefined)}
              >
                Từ chối
              </Button>
              <Button
                disabled={isLoading}
                onClick={() => onApprove(adminNote.trim() || undefined)}
              >
                Duyệt kích hoạt
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
