// Skill → Order Category Mapping
export const SKILL_TO_CATEGORIES = {
  ui_ux: ['ui_ux_design', 'web_design', 'app_design', 'wireframing'],
  poster_design: ['poster', 'flyer', 'banner', 'social_media_post'],
  video_editing: ['video_edit', 'reels', 'youtube_edit', 'motion_graphics'],
  logo_design: ['logo', 'branding', 'brand_identity'],
  web_development: ['website', 'landing_page', 'web_app'],
  content_writing: ['blog', 'copywriting', 'script'],
  photo_editing: ['photo_edit', 'product_photography', 'retouching'],
};

export const getCategoriesForSkills = (skills = []) =>
  [...new Set(skills.flatMap((skill) => SKILL_TO_CATEGORIES[skill] || []))];
