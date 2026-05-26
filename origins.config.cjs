/**
 * Single source of truth for per-origin Vite env (build + PM2 runtime).
 * Update URLs here, then rebuild (`npm run build:origins`) and `pm2 restart`.
 */
module.exports = {
  masai: {
    VITE_APP_ORIGIN: 'masai',
    VITE_OLD_STUDENT_UI_URL: 'https://demo-students.masaischool.com',
    VITE_NEW_STUDENT_UI_URL: 'https://students-demo-v2.masaischool.com',
  },
  ihub: {
    VITE_APP_ORIGIN: 'ihub',
    VITE_OLD_STUDENT_UI_URL: 'https://demo-students.ihubiitrcourses.org',
    VITE_NEW_STUDENT_UI_URL: 'https://students-demo-v2.ihubiitrcourses.org',
  },
}
