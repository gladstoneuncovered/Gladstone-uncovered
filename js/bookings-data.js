/* Seeded / exported bookings — merge with browser-saved bookings */
window.GLADSTONE_BOOKINGS = window.GLADSTONE_BOOKINGS || [];

/* Studio inbox — prefer js/config.js bookingEmail */
window.GLADSTONE_BOOKING_EMAIL =
  window.GLADSTONE_BOOKING_EMAIL ||
  (window.GLADSTONE_CONFIG && window.GLADSTONE_CONFIG.bookingEmail) ||
  "admin@gladstoneuncovered.com";
