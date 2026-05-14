import instaloader, json, os, requests

os.environ["INSTAGRAM_USERNAME"] = "ravi639089"
os.environ["INSTAGRAM_PASSWORD"] = "ms@2002"

l = instaloader.Instaloader(
    download_pictures=False, download_videos=False,
    download_video_thumbnails=False, download_comments=False,
    save_metadata=False, quiet=True
)
l.login(os.environ["INSTAGRAM_USERNAME"], os.environ["INSTAGRAM_PASSWORD"])
print("Login OK")

shortcode = "DBNu5vhxp7D"

# Try direct GraphQL query with instaloader session cookies
variables = '{{"shortcode":"{0}","child_comment_count":3,"fetch_comment_count":40,"has_threaded_comments":true,"parent_comment_count":24}}'.format(shortcode)
url = "https://www.instagram.com/graphql/query/?query_hash=9f8827793ef34641b2fb195d4d41151c&variables=" + variables

cookies = {}
for c in l.context._session.cookies:
    cookies[c.name] = c.value

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.instagram.com/",
}

try:
    r = requests.get(url, headers=headers, cookies=cookies, timeout=15)
    print("Status:", r.status_code)
    data = r.json()
    media = data.get("data", {}).get("shortcode_media", {})
    if media:
        caption = media.get("edge_media_to_caption", {}).get("edges", [{}])[0].get("node", {}).get("text", "")
        print("Caption:", caption[:50])
        print("Video view count:", media.get("video_view_count"))
        print("Video play count:", media.get("video_play_count"))
        print("Like count:", media.get("edge_media_preview_like", {}).get("count"))
        print("Comment count:", media.get("edge_media_to_comment", {}).get("count"))
    else:
        print("No media in response")
        print(json.dumps(data, indent=2)[:500])
except Exception as e:
    print("Error:", str(e)[:300])
    # Try Instaloader approach instead
    print("\nTrying instaloader approach...")
    try:
        post = instaloader.Post.from_shortcode(l.context, shortcode)
        print("Post found!")
        print("Caption:", (post.caption or "")[:50])
        print("Video view count:", post.video_view_count)
        print("Video play count:", getattr(post, "video_play_count", None))
        print("Like count:", post.likes)
    except Exception as e2:
        print("Instaloader also failed:", str(e2)[:200])
