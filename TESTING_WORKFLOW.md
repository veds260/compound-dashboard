# Dashboard Testing Workflow

Complete testing guide for all features across Admin, Writer, and Client roles.

---

## Pre-Test Setup

1. **Prepare Test Data:**
   - Create a test CSV file with 5-10 posts
   - Prepare 2-3 test images (JPEG/PNG, under 3MB each)
   - Have 2 different CSV files ready (for duplication testing)

2. **Browser Setup:**
   - Use incognito/private window for client testing
   - Keep main window for admin/writer testing
   - Ensure browser is in dark mode (or test that light mode doesn't break UI)

---

## Phase 1: Admin Setup (10 minutes)

**Goal:** Set up the foundation - users, clients, and initial data

### 1.1 Database Check
- [ ] Login as admin (compoundops@gmail.com)
- [ ] Navigate to Database Management page
- [ ] Verify "Media Management" section exists
- [ ] Check media statistics (should show 0 posts initially)

### 1.2 User Creation
- [ ] Go to User Management
- [ ] Create Writer 1: `writer1@test.com` (role: WRITER)
- [ ] Create Writer 2: `writer2@test.com` (role: WRITER)
- [ ] Create Client User: `client1@test.com` (role: CLIENT)
- [ ] Verify all users appear in the list

### 1.3 Client Creation
- [ ] Go to Client Management
- [ ] Create Client A:
  - Name: "Test Client A"
  - Twitter Handle: "@testclienta"
  - Assign Writer 1
  - Add profile picture (optional)
- [ ] Create Client B:
  - Name: "Test Client B"
  - Twitter Handle: "@testclientb"
  - Assign Writer 2
- [ ] Verify both clients show correct writer assignments

---

## Phase 2: Writer 1 - Initial Content Upload (15 minutes)

**Goal:** Upload content, test CSV duplication, add media

### 2.1 CSV Upload & Duplication Test
- [ ] Logout and login as Writer 1 (writer1@test.com)
- [ ] Navigate to Client A's page
- [ ] Upload CSV file #1 (10 posts)
- [ ] Wait for processing, verify success message
- [ ] Check all 10 posts appear in calendar view
- [ ] Note down post IDs and content

### 2.2 CSV Duplication Fix Test
- [ ] Upload the SAME CSV file #1 again
- [ ] Verify: Posts should update (not duplicate)
- [ ] Check: Total post count should still be 10
- [ ] Verify: All content matches, no duplicates in calendar

### 2.3 CSV Overwrite Test
- [ ] Upload CSV file #2 (different content, 8 posts)
- [ ] Verify: Posts are updated to match new CSV
- [ ] Check: Total posts should now be 8
- [ ] Verify: Old content is gone, new content appears

### 2.4 Media Upload Test
- [ ] Open Post Approval System (pending posts)
- [ ] Select first post, click to review
- [ ] In the modal sidebar, upload 2 images
- [ ] Verify: Images appear in preview grid
- [ ] Verify: Mockup shows images in rectangular aspect ratio
- [ ] Upload 2 more images (total 4)
- [ ] Try to upload 5th image
- [ ] Verify: Error message "Maximum 4 media items per post"

### 2.5 Media Layout Test
- [ ] Select post with 1 image
  - Verify: Single image displayed full width
- [ ] Select post with 2 images
  - Verify: Grid layout, 2 columns
- [ ] Select post with 3 images
  - Verify: Twitter layout (tall left, 2 stacked right)
- [ ] Select post with 4 images
  - Verify: 2x2 grid layout

### 2.6 Status Workflow Test
- [ ] Review post with media
- [ ] Click "Approve" → Verify status changes to APPROVED
- [ ] Click "Suggest Changes" → Add comment → Submit
- [ ] Verify status changes to SUGGEST_CHANGES
- [ ] Try to change status again
- [ ] Verify: Action buttons are disabled/hidden
- [ ] Verify: Message shows "Waiting for client to update"

---

## Phase 3: Writer 1 - Shareable Link Generation (5 minutes)

**Goal:** Generate and test share links

### 3.1 Generate Share Link
- [ ] Go to Client A's page
- [ ] Select a post with media (PENDING status)
- [ ] Click "Generate Share Link"
- [ ] Copy the generated link
- [ ] Verify: Link format is `https://yourapp.com/share/[token]`

---

## Phase 4: Client Review via Share Link (10 minutes)

**Goal:** Test client-side review without login, then with login

### 4.1 Guest Review (No Login)
- [ ] Open incognito/private window
- [ ] Paste the share link
- [ ] Verify: Page loads, shows post mockup with media
- [ ] Verify: Media displays correctly (3 images = Twitter layout)
- [ ] Verify: Status buttons are visible
- [ ] Try clicking "Approve"
- [ ] Verify: Redirects to login page with callback URL

### 4.2 Guest Commenting
- [ ] Scroll down to comments section
- [ ] Enter guest name: "Guest Tester"
- [ ] Add comment: "This looks great as a guest!"
- [ ] Submit comment
- [ ] Verify: Comment appears with guest name

### 4.3 Login and Status Change
- [ ] Click "Sign in to change status"
- [ ] Login as client user (client1@test.com)
- [ ] Verify: Redirects back to share page (not dashboard)
- [ ] Verify: Status buttons still visible (post is PENDING)
- [ ] Click "Approve"
- [ ] Verify: Status changes to APPROVED
- [ ] Verify: Action buttons disappear
- [ ] Verify: Message shows "This post has been approved"

### 4.4 Status Lock Test
- [ ] Try to access the same share link again
- [ ] Verify: Status buttons are hidden
- [ ] Verify: Can only view and comment
- [ ] Verify: Message explains post already reviewed

### 4.5 Suggest Changes Test
- [ ] Get another PENDING post share link from Writer 1
- [ ] Open in incognito, login as client
- [ ] Click "Suggest Changes"
- [ ] Verify: Modal opens with textarea
- [ ] Add changes: "Please make the text shorter"
- [ ] Submit
- [ ] Verify: Status changes to SUGGEST_CHANGES
- [ ] Verify: Comment appears in thread with changes

---

## Phase 5: Media Persistence Test (10 minutes)

**Goal:** Verify media survives CSV re-uploads

### 5.1 Check Media Before Re-upload
- [ ] Login back as Writer 1
- [ ] Go to Post Approval System
- [ ] Find the post with 4 media files
- [ ] Note: Post ID and media count

### 5.2 Re-upload CSV
- [ ] Upload CSV file #1 again (same as initial)
- [ ] Wait for processing
- [ ] Verify: Posts update from CSV

### 5.3 Verify Media Persistence
- [ ] Go back to Post Approval System
- [ ] Find the same post (by content)
- [ ] Verify: All 4 media files still present
- [ ] Verify: Images display correctly
- [ ] Verify: No media was lost during CSV update

---

## Phase 6: Admin - Media Management (10 minutes)

**Goal:** Test media deletion fail-safe features

### 6.1 View Media Statistics
- [ ] Login as admin
- [ ] Navigate to Database Management
- [ ] Scroll to "Media Management" section
- [ ] Verify: Statistics show correct post count
- [ ] Verify: Total size shown in MB
- [ ] Check: Posts list shows all posts with media

### 6.2 Post List Details
- [ ] Verify each post row shows:
  - Client name
  - Timestamp
  - Content preview (truncated)
  - Media count (e.g., "3 images")
  - Size in KB
  - Delete button

### 6.3 Delete Single Post Media
- [ ] Click delete button on one post
- [ ] Verify: Confirmation modal appears
- [ ] Verify: Warning message about permanent deletion
- [ ] Type incorrect text (e.g., "delete")
- [ ] Verify: Error "Please type DELETE to confirm"
- [ ] Type "DELETE" correctly
- [ ] Click "Confirm Delete"
- [ ] Verify: Success toast message
- [ ] Verify: Statistics update (post count decreases)
- [ ] Verify: Post removed from list

### 6.4 Verify Media Deleted from Post
- [ ] Switch to Writer 1 account
- [ ] Go to Post Approval System
- [ ] Find the post that had media deleted
- [ ] Verify: No media shows in mockup
- [ ] Verify: Media upload section is empty

### 6.5 Delete Recent Media (24h)
- [ ] Switch back to admin
- [ ] Click "Remove Recent Media (24h)" button
- [ ] Verify: Confirmation modal with specific warning
- [ ] Type "DELETE"
- [ ] Confirm deletion
- [ ] Verify: Success message shows count
- [ ] Verify: Statistics update
- [ ] Verify: All posts from last 24h have no media

### 6.6 Refresh Media Stats
- [ ] Click "Refresh" button
- [ ] Verify: Loading spinner appears
- [ ] Verify: Data reloads
- [ ] Verify: Counts match reality

---

## Phase 7: Admin - Client Reassignment (10 minutes)

**Goal:** Test moving clients between writers

### 7.1 Initial State
- [ ] Login as admin
- [ ] Go to Client Management
- [ ] Verify: Client A assigned to Writer 1
- [ ] Verify: Client B assigned to Writer 2

### 7.2 Reassign Client A
- [ ] Click edit on Client A
- [ ] Change writer from Writer 1 to Writer 2
- [ ] Save changes
- [ ] Verify: Success message
- [ ] Verify: Client A now shows Writer 2

### 7.3 Verify Writer Dashboards
- [ ] Login as Writer 1
- [ ] Verify: Dashboard shows 0 clients
- [ ] Verify: Client A no longer accessible

### 7.4 Verify New Writer Access
- [ ] Login as Writer 2
- [ ] Verify: Dashboard shows 2 clients (A and B)
- [ ] Verify: Can access both clients' posts
- [ ] Verify: Client A's posts and media are intact

### 7.5 Reassign Back
- [ ] Login as admin
- [ ] Reassign Client A back to Writer 1
- [ ] Verify Writer 1 can access again
- [ ] Verify all data intact

---

## Phase 8: Database Cleanup Testing (5 minutes)

**Goal:** Test database management features (use with caution)

### 8.1 Delete All Posts Test
- [ ] Login as admin
- [ ] Go to Database Management
- [ ] Click "Delete All Posts"
- [ ] Verify: Confirmation modal
- [ ] Type "DELETE"
- [ ] Confirm
- [ ] Verify: Success message
- [ ] Switch to Writer 1
- [ ] Verify: All posts removed from calendar

### 8.2 Restore Data
- [ ] Login as Writer 1
- [ ] Upload CSV again to restore posts
- [ ] Verify: Posts appear in calendar

---

## Phase 9: UI/UX Testing (10 minutes)

**Goal:** Verify UI consistency and dark mode

### 9.1 Dark Mode Test
- [ ] Set browser to light mode
- [ ] Navigate through all pages
- [ ] Verify: UI remains dark theme
- [ ] Verify: No white backgrounds appear
- [ ] Verify: Logo is white, not black
- [ ] Check pages:
  - Dashboard
  - Calendar view
  - Post Approval System modal
  - Client Management
  - User Management
  - Database Management
  - Share page

### 9.2 Calendar View Test
- [ ] Go to Writer dashboard
- [ ] Click on Client A
- [ ] Verify: Calendar displays posts
- [ ] Click on a post with media
- [ ] Verify: Modal shows mockup with media
- [ ] Verify: Media displays correctly

### 9.3 Responsive Layout Test
- [ ] Resize browser window to tablet size
- [ ] Verify: Navigation collapses appropriately
- [ ] Verify: Post grids adjust
- [ ] Test on mobile size
- [ ] Verify: Media grid stacks properly

---

## Phase 10: Edge Cases & Error Handling (10 minutes)

**Goal:** Test limits and error scenarios

### 10.1 Media Upload Limits
- [ ] Try uploading file larger than 3MB
- [ ] Verify: Error message about file size
- [ ] Try uploading unsupported format (.txt, .mp4)
- [ ] Verify: Error about file type
- [ ] Upload 4 images, try to add 5th
- [ ] Verify: Error about maximum limit

### 10.2 CSV Edge Cases
- [ ] Upload empty CSV
- [ ] Verify: Appropriate error handling
- [ ] Upload CSV with malformed data
- [ ] Verify: Error message or skips bad rows

### 10.3 Share Link Edge Cases
- [ ] Try accessing share link without token
- [ ] Verify: 404 or error page
- [ ] Try accessing with invalid token
- [ ] Verify: "Post not found" message
- [ ] Access approved post's share link
- [ ] Verify: Status buttons hidden
- [ ] Verify: Shows "already approved" message

### 10.4 Permission Tests
- [ ] Login as Writer 1
- [ ] Try accessing Writer 2's client (manual URL)
- [ ] Verify: Redirects or shows unauthorized
- [ ] Login as Client user
- [ ] Try accessing admin pages (manual URL)
- [ ] Verify: Redirects to appropriate dashboard

---

## Testing Checklist Summary

### Core Features
- [ ] User creation and management
- [ ] Client creation and assignment
- [ ] CSV upload and processing
- [ ] CSV duplication prevention
- [ ] CSV overwrite functionality
- [ ] Media upload (1-4 images)
- [ ] Media display (all layouts)
- [ ] Media persistence through CSV updates

### Status Workflow
- [ ] Post approval
- [ ] Suggest changes
- [ ] Rejection
- [ ] Status locking after client review
- [ ] Writer can't change status after client action

### Share Links
- [ ] Link generation
- [ ] Guest viewing
- [ ] Guest commenting
- [ ] Login redirect with callback
- [ ] Client status changes
- [ ] Status persistence

### Admin Features
- [ ] Media statistics viewing
- [ ] Individual media deletion
- [ ] Bulk recent media deletion (24h)
- [ ] Client reassignment
- [ ] Database cleanup
- [ ] Run migrations

### UI/UX
- [ ] Dark mode forced
- [ ] Calendar view with media
- [ ] Twitter-style media layouts
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Success/error toasts

---

## Estimated Total Testing Time: 90-105 minutes

**Quick Test (30 minutes):**
- Phases 1, 2.1-2.4, 3, 4.1-4.3, 6.1-6.3

**Full Test (105 minutes):**
- All phases

---

## Known Issues to Watch For

1. **CSV Duplication:** Should NOT create duplicates on re-upload
2. **Media Persistence:** Should SURVIVE CSV re-uploads
3. **Status Workflow:** Should LOCK after client changes status
4. **Login Redirect:** Should return to share page, not dashboard
5. **Dark Mode:** Should NEVER show light mode UI
6. **Media Layouts:** Should match Twitter's exact layout
7. **4-Image Limit:** Should enforce maximum strictly

---

## Post-Testing Cleanup

- [ ] Delete test users (keep admin)
- [ ] Delete test clients
- [ ] Clear test posts using "Delete All Posts"
- [ ] Verify media is cleared from database
- [ ] Check database size decreased appropriately
