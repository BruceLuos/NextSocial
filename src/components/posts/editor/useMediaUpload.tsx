import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";

/**
 * file 上传文件
 * mediaId 媒体id
 * isUploading 附件上传状态
 */
export interface Attachment {
  file: File;
  mediaId?: string;
  isUploading: boolean;
}

export default function useMediaUpload() {
  const { toast } = useToast();

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [uploadProgress, setUploadProgress] = useState<number>();

  const { startUpload, isUploading } = useUploadThing("attachment", {
    onBeforeUploadBegin(files) {
      // 重命名
      const renamedFiles = files.map((file) => {
        const extension = file.name.split(".").pop();
        return new File(
          [file],
          `attachment_${crypto.randomUUID()}.${extension}`,
          {
            type: file.type,
          },
        );
      });

      setAttachments((prev) => [
        ...prev,
        ...renamedFiles.map((file) => ({ file, isUploading: true })), // 上传中
      ]);

      return renamedFiles;
    },
    onUploadProgress: setUploadProgress,
    onClientUploadComplete(res) {
      setAttachments((prev) =>
        prev.map((a) => {
          const uploadResult = res.find((r) => r.name === a.file.name);

          if (!uploadResult) return a;

          return {
            ...a,
            mediaId: uploadResult.serverData.mediaId, // 更新媒体id
            isUploading: false, // 上传完成
          };
        }),
      );
    },
    onUploadError(e) {
      setAttachments((prev) => prev.filter((a) => !a.isUploading)); // 修改上传中的附件状态 为上传失败
      toast({
        variant: "destructive",
        description: e.message,
      });
    },
  });

  /**
   * 处理文件上传的初始化流程
   * 在开始上传前执行验证检查
   * 
   * @param files - 要上传的文件数组
   * @throws {Toast} 如果当前已有上传在进行中会抛出提示
   * @throws {Toast} 如果总附件数量超过5个限制会抛出提示
   * 
   * @example
   * handleStartUpload([file1, file2]);
   */

  function handleStartUpload(files: File[]) {
    if (isUploading) {
      toast({
        variant: "destructive",
        description: "Please wait for the current upload to finish.",
      });
      return;
    }

    if (attachments.length + files.length > 5) {
      toast({
        variant: "destructive",
        description: "You can only upload up to 5 attachments per post.",
      });
      return;
    }

    startUpload(files);
  }

  function removeAttachment(fileName: string) {
    setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
  }

  function reset() {
    setAttachments([]);
    setUploadProgress(undefined);
  }

  console.log("client upload attachments", attachments);

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset,
  };
}
