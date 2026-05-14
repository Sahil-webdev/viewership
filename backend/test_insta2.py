import instaloader, os, time, json

os.environ["INSTAGRAM_USERNAME"] = "ravi639089"
os.environ["INSTAGRAM_PASSWORD"] = "ms@2002"

print("Creating loader...")
l = instaloader.Instaloader(
    download_pictures=False, download_videos=False,
    download_video_thumbnails=False, download_comments=False,
    save_metadata=False, quiet=True
)

print("Logging in...")
l.login(os.environ["INSTAGRAM_USERNAME"], os.environ["INSTAGRAM_PASSWORD"])
print("Login OK, user_id:", l.context.user_id)

# Try getting a post directly with a delay
shortcode = "C3Fj5C0r4XK"
time.sleep(5)

print("\nTrying to fetch post with shortcode:", shortcode)
try:
    post = instaloader.Post.from_shortcode(l.context, shortcode)
    print("SUCCESS!")
    print("  Username:", post.owner_username)
    print("  Is video:", post.is_video)
    print("  Caption:", (post.caption or "")[:80])
    print("  Like count:", post.likes)
    print("  Comment count:", post.comments)
    print("  Video view count:", post.video_view_count)
    print("  Video play count:", getattr(post, "video_play_count", None))
    print("  Date:", post.date_utc)
except Exception as e:
    print("FAILED:", str(e)[:200])

# Wait and try another
time.sleep(5)
shortcode2 = "DGkLmNup7u_"
print("\nTrying shortcode:", shortcode2)
try:
    post = instaloader.Post.from_shortcode(l.context, shortcode2)
    print("SUCCESS!")
    print("  Username:", post.owner_username)
    print("  Is video:", post.is_video)
    print("  Video view count:", post.video_view_count)
except Exception as e:
    print("FAILED:", str(e)[:200])

# Try own account post
time.sleep(5)
shortcode3 = "DXRUdWMkrHc"
print("\nTrying own reel shortcode:", shortcode3)
try:
    post = instaloader.Post.from_shortcode(l.context, shortcode3)
    print("SUCCESS!")
    print("  Username:", post.owner_username)
    print("  Is video:", post.is_video)
    print("  Video view count:", post.video_view_count)
except Exception as e:
    print("FAILED:", str(e)[:200])
