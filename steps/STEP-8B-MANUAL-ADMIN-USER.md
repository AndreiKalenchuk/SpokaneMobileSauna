# Step 8B: Create Admin User (YOU do this)

After the AI builds the admin dashboard, create your admin account.

---

## Create your admin user in Supabase

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add user"** → "Create new user"
3. Enter:
   - Email: your personal email
   - Password: a strong password
4. Click "Create user"

## Test admin login

- [ ] Go to `http://localhost:5173/admin/login`
- [ ] Log in with the email and password you just created
- [ ] Verify you can see the admin dashboard
- [ ] Verify you can see bookings (there should be test bookings from Step 7B)
- [ ] Try blocking a date and verify it shows as unavailable on the public booking calendar
- [ ] Try editing a product price and verify the change shows on the public site

---

*Delete this file after verifying admin access works.*
