import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Resource, MediaType, GradeLevel, SiteSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createResource, updateResource, uploadFileToStorage, DEFAULT_GRADE_LEVELS } from '../services/db';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siteSettings: SiteSettings | null;
  editResource?: Resource | null;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  siteSettings,
  editResource
}) => {
  const { user, profile } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('ทุกระดับชั้น');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [sourceType, setSourceType] = useState<'url' | 'upload'>('url');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editResource) {
      setTitle(editResource.title || '');
      setDescription(editResource.description || '');
      setCategory(editResource.category || (siteSettings?.categories[0] || 'อื่นๆ'));
      setGradeLevel(editResource.gradeLevel || 'ทุกระดับชั้น');
      setMediaType(editResource.mediaType || 'pdf');
      setFileUrl(editResource.fileUrl || '');
      setTagsInput(editResource.tags ? editResource.tags.join(', ') : '');
      setSourceType('url');
    } else {
      setTitle('');
      setDescription('');
      setCategory(siteSettings?.categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setGradeLevel('ทุกระดับชั้น');
      setMediaType('pdf');
      setSourceType('url');
      setFileUrl('');
      setSelectedFile(null);
      setUploadProgress(null);
      setTagsInput('');
    }
    setFormErrors({});
  }, [editResource, isOpen, siteSettings]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'กรุณาระบุชื่อสื่อหรือหัวข้อความรู้';
    if (!description.trim()) errors.description = 'กรุณากรอกคำอธิบายหรือเนื้อหาโดยย่อ';
    if (!category) errors.category = 'กรุณาเลือกหมวดหมู่วิชา';

    if (sourceType === 'url') {
      if (!fileUrl.trim()) {
        errors.fileUrl = 'กรุณาระบุลิงก์สื่อ (URL)';
      } else if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        errors.fileUrl = 'ลิงก์ต้องขึ้นต้นด้วย https:// หรือ http://';
      }
    } else {
      if (!editResource && !selectedFile) {
        errors.file = 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลดจากเครื่อง';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('กรุณาเข้าสู่ระบบก่อนทำการโพสต์');
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    try {
      let finalFileUrl = fileUrl.trim();
      let finalFileName = editResource?.fileName || '';
      let finalFileSize = editResource?.fileSize;

      // Handle file upload to Firebase Storage if selected
      if (sourceType === 'upload' && selectedFile) {
        const uploadRes = await uploadFileToStorage(selectedFile, 'resources', (pct) => {
          setUploadProgress(pct);
        });
        finalFileUrl = uploadRes.url;
        finalFileName = uploadRes.fileName;
        finalFileSize = uploadRes.fileSize;
      }

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      if (editResource) {
        await updateResource(editResource.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          mediaType,
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          tags
        });
        success('อัปเดตสื่อความรู้สำเร็จ', 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
      } else {
        await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          mediaType,
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          authorId: user.uid,
          authorName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'สมาชิก',
          authorEmail: user.email || '',
          status: 'published',
          tags
        });
        success('โพสต์สื่อความรู้สำเร็จ', 'ขอบคุณที่ร่วมแบ่งปันความรู้ให้กับเพื่อนๆ');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      error('เกิดข้อผิดพลาดในการบันทึกข้อมูล', err?.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              {editResource ? 'แก้ไขสื่อความรู้' : 'แบ่งปันสื่อความรู้ใหม่'}
            </h3>
            <p className="text-xs text-slate-500">
              {editResource ? 'แก้ไขรายละเอียดเนื้อหาและสื่อ' : 'โพสต์เอกสาร สรุปบทเรียน หรือวิดีโอเพื่อการศึกษา'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อสื่อ / หัวข้อความรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.ปลาย, คู่มือเขียนแอปเบื้องต้น"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                formErrors.title
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
            {formErrors.title && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.title}
              </p>
            )}
          </div>

          {/* Category & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                {siteSettings?.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ระดับชั้นที่เหมาะสม
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                {DEFAULT_GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type & Source Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ประเภทของสื่อ
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                <option value="pdf">PDF (เอกสารสรุป/ข้อสอบ)</option>
                <option value="video">วิดีโอ (YouTube / คลิปสอน)</option>
                <option value="website">เว็บไซต์ / คลังข้อมูลภายนอก</option>
                <option value="document">เอกสาร (Word / Slides / ชีต)</option>
                <option value="image">รูปภาพ / อินโฟกราฟิก</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                วิธีแนบสื่อ
              </label>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSourceType('url')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                    sourceType === 'url' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>แนบลิงก์ (URL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('upload')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                    sourceType === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดไฟล์จริง</span>
                </button>
              </div>
            </div>
          </div>

          {/* URL or Upload Input */}
          {sourceType === 'url' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ลิงก์สื่อ (Google Drive, YouTube, เว็บไซต์ ฯลฯ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... หรือ https://youtu.be/..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  formErrors.fileUrl
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {formErrors.fileUrl && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.fileUrl}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เลือกไฟล์เพื่ออัปโหลดลง Cloud Storage <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    รองรับ PDF, วิดีโอ MP4, รูปภาพ PNG/JPG หรือเอกสาร
                  </p>
                </label>
              </div>

              {uploadProgress !== null && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>กำลังอัปโหลดไปยัง Firebase Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {formErrors.file && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.file}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              คำอธิบายและเนื้อหาโดยย่อ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายว่าสื่อนี้มีประโยชน์อย่างไร ครอบคลุมบทเรียนไหน หรือมีเคล็ดลับการอ่านอย่างไร..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                formErrors.description
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-blue-200 focus:border-blue-500'
              }`}
            ></textarea>
            {formErrors.description && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.description}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ป้ายกำกับ (คั่นด้วยจุลภาค ,)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น ข้อสอบ, ฟิสิกส์, ม.5, สรุปเข้ม"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <span>{editResource ? 'บันทึกการแก้ไข' : 'โพสต์สื่อความรู้'}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
