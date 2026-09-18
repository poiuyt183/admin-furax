export type SeoCheckStatus = "pass" | "warning" | "fail";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  score: number;
  maxScore: number;
  message: string;
  suggestion?: string;
};

export type SeoGrade = "A" | "B" | "C" | "D" | "F";

export type SeoResult = {
  totalScore: number;
  maxScore: number;
  grade: SeoGrade;
  checks: SeoCheck[];
};

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword?: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  const clean = text.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

function getGrade(score: number, max: number): SeoGrade {
  const pct = (score / max) * 100;
  if (pct >= 85) return "A";
  if (pct >= 70) return "B";
  if (pct >= 50) return "C";
  if (pct >= 30) return "D";
  return "F";
}

function checkTitleLength(input: SeoInput): SeoCheck {
  const MAX_SCORE = 10;
  const title = input.metaTitle || input.title;
  const len = title.length;

  if (len === 0) {
    return {
      id: "title-length",
      label: "Độ dài tiêu đề",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: "Chưa có tiêu đề.",
      suggestion: "Thêm tiêu đề bài viết (tối ưu 50-60 ký tự).",
    };
  }

  if (len >= 50 && len <= 60) {
    return {
      id: "title-length",
      label: "Độ dài tiêu đề",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Tiêu đề dài ${len} ký tự — tối ưu!`,
    };
  }

  if ((len >= 40 && len < 50) || (len > 60 && len <= 70)) {
    return {
      id: "title-length",
      label: "Độ dài tiêu đề",
      status: "warning",
      score: 7,
      maxScore: MAX_SCORE,
      message: `Tiêu đề dài ${len} ký tự — chấp nhận được.`,
      suggestion: "Tối ưu nhất là 50-60 ký tự để hiển thị tốt trên Google.",
    };
  }

  return {
    id: "title-length",
    label: "Độ dài tiêu đề",
    status: "fail",
    score: 3,
    maxScore: MAX_SCORE,
    message: `Tiêu đề dài ${len} ký tự — ${len < 40 ? "quá ngắn" : "quá dài"}.`,
    suggestion: len < 40
      ? "Tiêu đề nên dài 50-60 ký tự để tối ưu SEO."
      : "Tiêu đề quá dài, Google sẽ cắt bớt. Giữ trong 50-60 ký tự.",
  };
}

function checkMetaDescription(input: SeoInput): SeoCheck {
  const MAX_SCORE = 10;
  const desc = input.metaDescription || input.excerpt;
  const len = desc.length;

  if (len === 0) {
    return {
      id: "meta-description",
      label: "Meta Description",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: "Chưa có meta description.",
      suggestion: "Thêm mô tả SEO hoặc tóm tắt (tối ưu 150-160 ký tự).",
    };
  }

  if (len >= 150 && len <= 160) {
    return {
      id: "meta-description",
      label: "Meta Description",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Meta description dài ${len} ký tự — tối ưu!`,
    };
  }

  if ((len >= 120 && len < 150) || (len > 160 && len <= 180)) {
    return {
      id: "meta-description",
      label: "Meta Description",
      status: "warning",
      score: 7,
      maxScore: MAX_SCORE,
      message: `Meta description dài ${len} ký tự — chấp nhận được.`,
      suggestion: "Tối ưu nhất là 150-160 ký tự.",
    };
  }

  return {
    id: "meta-description",
    label: "Meta Description",
    status: "fail",
    score: 3,
    maxScore: MAX_SCORE,
    message: `Meta description dài ${len} ký tự — ${len < 120 ? "quá ngắn" : "quá dài"}.`,
    suggestion: len < 120
      ? "Meta description nên dài 150-160 ký tự để hiển thị đầy đủ trên Google."
      : "Meta description quá dài, Google sẽ cắt bớt.",
  };
}

function checkSlug(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;
  const slug = input.slug;

  if (!slug) {
    return {
      id: "slug",
      label: "Đường dẫn (Slug)",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: "Chưa có đường dẫn.",
      suggestion: "Thêm slug cho bài viết.",
    };
  }

  if (slug.length >= 3 && slug.length <= 75) {
    return {
      id: "slug",
      label: "Đường dẫn (Slug)",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Slug "${slug}" — hợp lệ và dễ đọc.`,
    };
  }

  return {
    id: "slug",
    label: "Đường dẫn (Slug)",
    status: "warning",
    score: 3,
    maxScore: MAX_SCORE,
    message: slug.length < 3 ? "Slug quá ngắn." : "Slug quá dài.",
    suggestion: "Slug nên từ 3-75 ký tự, ngắn gọn và mô tả nội dung.",
  };
}

function checkCoverImage(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;

  if (input.coverImage) {
    return {
      id: "cover-image",
      label: "Ảnh bìa",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: "Bài viết có ảnh bìa.",
    };
  }

  return {
    id: "cover-image",
    label: "Ảnh bìa",
    status: "fail",
    score: 0,
    maxScore: MAX_SCORE,
    message: "Chưa có ảnh bìa.",
    suggestion: "Thêm ảnh bìa để tăng tỷ lệ click khi chia sẻ trên mạng xã hội.",
  };
}

function checkContentLength(input: SeoInput): SeoCheck {
  const MAX_SCORE = 15;
  const plainText = stripHtml(input.content);
  const wordCount = countWords(plainText);

  if (wordCount >= 1000) {
    return {
      id: "content-length",
      label: "Độ dài nội dung",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Nội dung dài ${wordCount} từ — rất tốt!`,
    };
  }

  if (wordCount >= 600) {
    return {
      id: "content-length",
      label: "Độ dài nội dung",
      status: "pass",
      score: 12,
      maxScore: MAX_SCORE,
      message: `Nội dung dài ${wordCount} từ — tốt.`,
      suggestion: "Có thể bổ sung thêm nội dung để đạt 1000+ từ.",
    };
  }

  if (wordCount >= 300) {
    return {
      id: "content-length",
      label: "Độ dài nội dung",
      status: "warning",
      score: 8,
      maxScore: MAX_SCORE,
      message: `Nội dung dài ${wordCount} từ — đạt mức tối thiểu.`,
      suggestion: "Nội dung dài hơn 600 từ sẽ có lợi thế SEO hơn.",
    };
  }

  return {
    id: "content-length",
    label: "Độ dài nội dung",
    status: "fail",
    score: wordCount > 0 ? 3 : 0,
    maxScore: MAX_SCORE,
    message: wordCount === 0
      ? "Chưa có nội dung."
      : `Nội dung chỉ có ${wordCount} từ — quá ngắn.`,
    suggestion: "Nội dung cần ít nhất 300 từ, tối ưu 600-1000+ từ.",
  };
}

function checkHeadingStructure(input: SeoInput): SeoCheck {
  const MAX_SCORE = 10;
  const content = input.content;

  const h2Matches = content.match(/<h2[^>]*>/gi) ?? [];
  const h3Matches = content.match(/<h3[^>]*>/gi) ?? [];
  const hasH1 = /<h1[^>]*>/i.test(content);

  if (hasH1) {
    return {
      id: "heading-structure",
      label: "Cấu trúc heading",
      status: "warning",
      score: 5,
      maxScore: MAX_SCORE,
      message: "Nội dung chứa thẻ H1 — không nên dùng H1 trong bài viết.",
      suggestion: "H1 đã là tiêu đề trang. Sử dụng H2, H3 cho các mục con.",
    };
  }

  if (h2Matches.length >= 2 && h3Matches.length >= 1) {
    return {
      id: "heading-structure",
      label: "Cấu trúc heading",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Có ${h2Matches.length} H2 và ${h3Matches.length} H3 — cấu trúc tốt!`,
    };
  }

  if (h2Matches.length >= 1) {
    return {
      id: "heading-structure",
      label: "Cấu trúc heading",
      status: "warning",
      score: 6,
      maxScore: MAX_SCORE,
      message: `Có ${h2Matches.length} H2, ${h3Matches.length} H3 — nên thêm.`,
      suggestion: "Thêm ít nhất 2 H2 và 1 H3 để cải thiện cấu trúc nội dung.",
    };
  }

  return {
    id: "heading-structure",
    label: "Cấu trúc heading",
    status: "fail",
    score: 0,
    maxScore: MAX_SCORE,
    message: "Nội dung không có heading (H2/H3).",
    suggestion: "Chia nội dung thành các mục với H2, H3 để dễ đọc và tối ưu SEO.",
  };
}

function checkImageAltText(input: SeoInput): SeoCheck {
  const MAX_SCORE = 10;
  const imgRegex = /<img[^>]*>/gi;
  const images = input.content.match(imgRegex) ?? [];

  if (images.length === 0) {
    return {
      id: "image-alt",
      label: "Alt text ảnh",
      status: "warning",
      score: 5,
      maxScore: MAX_SCORE,
      message: "Nội dung không có hình ảnh.",
      suggestion: "Thêm ít nhất 1 hình ảnh minh họa vào bài viết.",
    };
  }

  const imagesWithoutAlt = images.filter((img) => {
    const altMatch = img.match(/alt\s*=\s*["']([^"']*)["']/i);
    return !altMatch || altMatch[1].trim() === "";
  });

  if (imagesWithoutAlt.length === 0) {
    return {
      id: "image-alt",
      label: "Alt text ảnh",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Tất cả ${images.length} ảnh đều có alt text.`,
    };
  }

  const ratio = (images.length - imagesWithoutAlt.length) / images.length;

  return {
    id: "image-alt",
    label: "Alt text ảnh",
    status: ratio >= 0.5 ? "warning" : "fail",
    score: Math.round(MAX_SCORE * ratio),
    maxScore: MAX_SCORE,
    message: `${imagesWithoutAlt.length}/${images.length} ảnh thiếu alt text.`,
    suggestion: "Thêm mô tả alt text cho tất cả ảnh để cải thiện SEO và accessibility.",
  };
}

function checkReadability(input: SeoInput): SeoCheck {
  const MAX_SCORE = 15;
  const plainText = stripHtml(input.content);

  if (!plainText) {
    return {
      id: "readability",
      label: "Tính dễ đọc",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: "Chưa có nội dung để phân tích.",
    };
  }

  const sentences = plainText
    .split(/[.!?。？！]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const paragraphs = input.content
    .split(/<\/p>|<br\s*\/?>/gi)
    .map((p) => stripHtml(p).trim())
    .filter((p) => p.length > 0);

  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
    : 0;

  const longParagraphs = paragraphs.filter((p) => countWords(p) > 150);

  let score = MAX_SCORE;
  const issues: string[] = [];

  if (avgSentenceLength > 25) {
    score -= 5;
    issues.push(`Câu trung bình dài ${Math.round(avgSentenceLength)} từ (nên ≤25)`);
  } else if (avgSentenceLength > 20) {
    score -= 2;
  }

  if (longParagraphs.length > 0) {
    score -= 3 * Math.min(longParagraphs.length, 3);
    issues.push(`${longParagraphs.length} đoạn văn quá dài (>150 từ)`);
  }

  if (sentences.length < 3) {
    score -= 3;
    issues.push("Quá ít câu trong nội dung");
  }

  score = Math.max(0, score);

  if (score >= 12) {
    return {
      id: "readability",
      label: "Tính dễ đọc",
      status: "pass",
      score,
      maxScore: MAX_SCORE,
      message: `Nội dung dễ đọc (câu TB ${Math.round(avgSentenceLength)} từ).`,
    };
  }

  return {
    id: "readability",
    label: "Tính dễ đọc",
    status: score >= 8 ? "warning" : "fail",
    score,
    maxScore: MAX_SCORE,
    message: issues.join(". ") + ".",
    suggestion: "Viết câu ngắn hơn (≤25 từ) và chia đoạn văn nhỏ hơn (≤150 từ/đoạn).",
  };
}

function checkKeywordInTitle(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;
  const keyword = input.focusKeyword?.trim().toLowerCase();

  if (!keyword) {
    return {
      id: "keyword-title",
      label: "Từ khóa trong tiêu đề",
      status: "warning",
      score: 3,
      maxScore: MAX_SCORE,
      message: "Chưa nhập từ khóa trọng tâm.",
      suggestion: "Nhập từ khóa để kiểm tra sự xuất hiện trong tiêu đề.",
    };
  }

  const title = (input.metaTitle || input.title).toLowerCase();

  if (title.includes(keyword)) {
    return {
      id: "keyword-title",
      label: "Từ khóa trong tiêu đề",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Từ khóa "${input.focusKeyword}" có trong tiêu đề.`,
    };
  }

  return {
    id: "keyword-title",
    label: "Từ khóa trong tiêu đề",
    status: "fail",
    score: 0,
    maxScore: MAX_SCORE,
    message: `Từ khóa "${input.focusKeyword}" không có trong tiêu đề.`,
    suggestion: "Thêm từ khóa trọng tâm vào tiêu đề để tối ưu SEO.",
  };
}

function checkKeywordInContent(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;
  const keyword = input.focusKeyword?.trim().toLowerCase();

  if (!keyword) {
    return {
      id: "keyword-content",
      label: "Từ khóa trong nội dung",
      status: "warning",
      score: 3,
      maxScore: MAX_SCORE,
      message: "Chưa nhập từ khóa trọng tâm.",
    };
  }

  const plainText = stripHtml(input.content).toLowerCase();
  const wordCount = countWords(plainText);

  if (wordCount === 0) {
    return {
      id: "keyword-content",
      label: "Từ khóa trong nội dung",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: "Chưa có nội dung.",
    };
  }

  const keywordCount = plainText.split(keyword).length - 1;
  const density = (keywordCount / wordCount) * 100;

  if (keywordCount === 0) {
    return {
      id: "keyword-content",
      label: "Từ khóa trong nội dung",
      status: "fail",
      score: 0,
      maxScore: MAX_SCORE,
      message: `Từ khóa "${input.focusKeyword}" không xuất hiện trong nội dung.`,
      suggestion: "Thêm từ khóa trọng tâm vào nội dung một cách tự nhiên.",
    };
  }

  if (density >= 1 && density <= 3) {
    return {
      id: "keyword-content",
      label: "Từ khóa trong nội dung",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Mật độ từ khóa: ${density.toFixed(1)}% (${keywordCount} lần) — tối ưu!`,
    };
  }

  if (density > 3) {
    return {
      id: "keyword-content",
      label: "Từ khóa trong nội dung",
      status: "warning",
      score: 3,
      maxScore: MAX_SCORE,
      message: `Mật độ từ khóa: ${density.toFixed(1)}% — hơi cao.`,
      suggestion: "Mật độ từ khóa nên ở mức 1-3% để tránh bị coi là spam.",
    };
  }

  return {
    id: "keyword-content",
    label: "Từ khóa trong nội dung",
    status: "warning",
    score: 3,
    maxScore: MAX_SCORE,
    message: `Mật độ từ khóa: ${density.toFixed(1)}% (${keywordCount} lần) — thấp.`,
    suggestion: "Thêm từ khóa vào nội dung sao cho mật độ đạt 1-3%.",
  };
}

function checkKeywordInSlug(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;
  const keyword = input.focusKeyword?.trim().toLowerCase();

  if (!keyword) {
    return {
      id: "keyword-slug",
      label: "Từ khóa trong slug",
      status: "warning",
      score: 3,
      maxScore: MAX_SCORE,
      message: "Chưa nhập từ khóa trọng tâm.",
    };
  }

  const keywordSlug = keyword.replace(/\s+/g, "-");
  const slug = input.slug.toLowerCase();

  if (slug.includes(keywordSlug) || slug.includes(keyword.replace(/\s+/g, ""))) {
    return {
      id: "keyword-slug",
      label: "Từ khóa trong slug",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Slug chứa từ khóa "${input.focusKeyword}".`,
    };
  }

  return {
    id: "keyword-slug",
    label: "Từ khóa trong slug",
    status: "fail",
    score: 0,
    maxScore: MAX_SCORE,
    message: `Slug không chứa từ khóa "${input.focusKeyword}".`,
    suggestion: "Thêm từ khóa trọng tâm vào slug để cải thiện SEO.",
  };
}

function checkInternalLinks(input: SeoInput): SeoCheck {
  const MAX_SCORE = 5;
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(input.content)) !== null) {
    links.push(match[1]);
  }

  const internalLinks = links.filter(
    (href) => href.startsWith("/") || href.startsWith("#"),
  );

  if (internalLinks.length >= 2) {
    return {
      id: "internal-links",
      label: "Liên kết nội bộ",
      status: "pass",
      score: MAX_SCORE,
      maxScore: MAX_SCORE,
      message: `Có ${internalLinks.length} liên kết nội bộ.`,
    };
  }

  if (internalLinks.length === 1) {
    return {
      id: "internal-links",
      label: "Liên kết nội bộ",
      status: "warning",
      score: 3,
      maxScore: MAX_SCORE,
      message: "Chỉ có 1 liên kết nội bộ.",
      suggestion: "Thêm ít nhất 2 liên kết nội bộ đến các bài viết/trang khác.",
    };
  }

  return {
    id: "internal-links",
    label: "Liên kết nội bộ",
    status: "fail",
    score: 0,
    maxScore: MAX_SCORE,
    message: "Không có liên kết nội bộ.",
    suggestion: "Thêm liên kết đến các bài viết hoặc trang liên quan trên website.",
  };
}

export function analyzeSeo(input: SeoInput): SeoResult {
  const checks: SeoCheck[] = [
    checkTitleLength(input),
    checkMetaDescription(input),
    checkSlug(input),
    checkCoverImage(input),
    checkContentLength(input),
    checkHeadingStructure(input),
    checkImageAltText(input),
    checkReadability(input),
    checkKeywordInTitle(input),
    checkKeywordInContent(input),
    checkKeywordInSlug(input),
    checkInternalLinks(input),
  ];

  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const maxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);

  return {
    totalScore,
    maxScore,
    grade: getGrade(totalScore, maxScore),
    checks,
  };
}
