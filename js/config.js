/* Public site config — safe to commit */
window.GLADSTONE_CONFIG = {
  /** Cal.com slug — Availability page */
  calLink: "gladstone-uncovered-ipthyu",
  calLayout: "month_view",
  /** All booking + enquiry mail */
  bookingEmail: "admin@gladstoneuncovered.com",
  /** Public Web3Forms key. It can only deliver to bookingEmail. */
  quoteAccessKey: "f271b9ce-acf5-4183-bf9d-2f77de9e9a28",
  /** Supabase — used for Stripe checkout Edge Function */
  supabaseUrl: "https://tcpglranzdomamazzbqb.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcGdscmFuemRvbWFtYXp6YnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyOTA1NTUsImV4cCI6MjEwNTg2NjU1NX0.79covpzY1q_xzHSL6EePV4ANuRYkYog-KKLh7rTlU-Q",
};

window.GLADSTONE_BOOKING_EMAIL =
  window.GLADSTONE_CONFIG.bookingEmail || "admin@gladstoneuncovered.com";
