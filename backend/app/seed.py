"""
Seed script — populates the database with realistic demo data.
Run: python -m app.seed
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import (
    Base, User, Profile, UserSettings, Follow, Post, PostMedia,
    Reaction, Comment, Conversation, ConversationMember, Message,
    Community, CommunityMember, Notification, NotificationType, ReactionType
)
from datetime import datetime, timezone, timedelta
import uuid

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def utcnow():
    return datetime.now(timezone.utc)

def days_ago(n):
    return datetime.now(timezone.utc) - timedelta(days=n)

print("Seeding database...")

# ── Clear existing seed users ──────────────────────────────────────────────────
for u in db.query(User).filter(User.email.in_([
    "alice@connectly.io", "bob@connectly.io", "carol@connectly.io",
    "dave@connectly.io", "emma@connectly.io", "frank@connectly.io",
])).all():
    db.delete(u)
db.commit()

# ── Users ──────────────────────────────────────────────────────────────────────
users_data = [
    {"full_name": "Alice Chen",    "username": "alicechen",   "email": "alice@connectly.io",
     "bio": "UI/UX Designer & Travel enthusiast 🌍", "location": "San Francisco, CA",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alice"},
    {"full_name": "Bob Martinez",  "username": "bobmartinez", "email": "bob@connectly.io",
     "bio": "Full-stack dev | Open source contributor ☕", "location": "Austin, TX",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=bob"},
    {"full_name": "Carol Park",    "username": "carolpark",   "email": "carol@connectly.io",
     "bio": "Photographer 📸 | Nature & Architecture", "location": "Seattle, WA",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=carol"},
    {"full_name": "Dave Wilson",   "username": "davewilson",  "email": "dave@connectly.io",
     "bio": "Music producer 🎵 | Coffee addict", "location": "Nashville, TN",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=dave"},
    {"full_name": "Emma Johnson",  "username": "emmajohnson",  "email": "emma@connectly.io",
     "bio": "AI researcher | Building the future 🤖", "location": "Boston, MA",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=emma"},
    {"full_name": "Frank Lee",     "username": "franklee",    "email": "frank@connectly.io",
     "bio": "Startup founder | Fitness & Health 💪", "location": "New York, NY",
     "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=frank"},
]

created_users = []
for ud in users_data:
    user = User(
        email=ud["email"], username=ud["username"],
        full_name=ud["full_name"],
        hashed_password=get_password_hash("password123"),
        is_verified=True,
    )
    db.add(user)
    db.flush()
    profile = Profile(
        user_id=user.id, bio=ud["bio"], location=ud["location"],
        avatar_url=ud["avatar"],
        cover_url=f"https://picsum.photos/seed/{ud['username']}/1200/400",
    )
    db.add(profile)
    db.add(UserSettings(user_id=user.id))
    created_users.append(user)

db.commit()

# ── Follows ────────────────────────────────────────────────────────────────────
follow_pairs = [
    (0,1),(0,2),(0,4),(1,0),(1,2),(1,3),(2,0),(2,1),(2,4),
    (3,1),(3,4),(4,0),(4,1),(4,2),(4,5),(5,0),(5,3),(5,4),
]
for fi, ti in follow_pairs:
    db.add(Follow(follower_id=created_users[fi].id, followed_id=created_users[ti].id))
db.commit()

# ── Posts ──────────────────────────────────────────────────────────────────────
posts_data = [
    {"author": 0, "content": "Just shipped a new design system for Connectly! 🎨 Excited to share the lavender & violet palette — accessibility-first, beautiful by default. What do you think of the new aesthetic?", "days": 1, "img": "https://picsum.photos/seed/design1/800/500"},
    {"author": 1, "content": "Built a real-time chat feature with WebSockets today. FastAPI + PostgreSQL is such a joy to work with. The latency is insane! ⚡", "days": 2, "img": "https://picsum.photos/seed/code1/800/500"},
    {"author": 2, "content": "Golden hour in the Cascades 🌄 Sometimes you just need to step away from the screen and breathe.", "days": 1, "img": "https://picsum.photos/seed/nature1/800/600"},
    {"author": 3, "content": "Just dropped a new track 🎵 Been working on this lo-fi beat for weeks. Sampling vintage vinyl never gets old. Link in bio!", "days": 3, "img": None},
    {"author": 4, "content": "Fascinating new paper on transformer attention mechanisms. The scaling laws hold even at 1T parameters — we're just getting started. 🤖 Thread below ↓", "days": 2, "img": "https://picsum.photos/seed/ai1/800/500"},
    {"author": 5, "content": "30 days of 5AM workouts ✅ Consistency > intensity. Your future self will thank you. Start with just 10 minutes. 💪", "days": 1, "img": "https://picsum.photos/seed/fitness1/800/500"},
    {"author": 0, "content": "Exploring glassmorphism in modern UI design. Blur, translucency, and layered depth — when used tastefully, it's chef's kiss ✨", "days": 4, "img": "https://picsum.photos/seed/ui1/800/500"},
    {"author": 2, "content": "Architecture photography hits different on rainy days 🏛️ The reflections, the contrast, the textures...", "days": 5, "img": "https://picsum.photos/seed/arch1/800/600"},
    {"author": 1, "content": "Open source tip: Write tests first when reviewing PRs. It's the fastest way to understand intent AND catch regressions. 🔍", "days": 6, "img": None},
    {"author": 4, "content": "Hot take: the best way to learn ML is to build something, break it, debug it, and rebuild it. Papers are secondary. Change my mind.", "days": 3, "img": None},
]

created_posts = []
for pd in posts_data:
    post = Post(
        author_id=created_users[pd["author"]].id,
        content=pd["content"],
        is_public=True,
        created_at=days_ago(pd["days"]),
        updated_at=days_ago(pd["days"]),
    )
    db.add(post)
    db.flush()
    if pd.get("img"):
        db.add(PostMedia(post_id=post.id, url=pd["img"], media_type="image", order_index=0))
    created_posts.append(post)

db.commit()

# ── Reactions ──────────────────────────────────────────────────────────────────
reaction_pairs = [
    (1,0,"like"),(2,0,"love"),(3,0,"wow"),(4,0,"like"),
    (0,1,"like"),(2,1,"like"),(4,1,"wow"),
    (0,2,"love"),(1,2,"wow"),(4,2,"love"),(5,2,"love"),
    (0,3,"like"),(1,3,"like"),(2,3,"haha"),
    (0,4,"wow"),(1,4,"like"),(2,4,"wow"),(3,4,"like"),
    (1,5,"like"),(2,5,"love"),(3,5,"like"),(4,5,"wow"),
]
for ui, pi, rt in reaction_pairs:
    db.add(Reaction(user_id=created_users[ui].id, post_id=created_posts[pi].id, reaction_type=rt))
db.commit()

# ── Comments ───────────────────────────────────────────────────────────────────
comment_data = [
    (1,0,"This palette is absolutely gorgeous! The lavender tones feel premium without being overwhelming."),
    (2,0,"Great work! The accessibility considerations really show. How did you handle the contrast ratios?"),
    (0,1,"FastAPI is genuinely one of the best Python frameworks ever made. The auto-docs alone are worth it!"),
    (3,1,"How does it compare to Go for this kind of thing performance-wise?"),
    (0,2,"This photo is stunning! What camera gear are you using?"),
    (1,2,"The lighting is unreal. Did you do any post-processing or is this SOOC?"),
    (0,3,"This hits differently. The vinyl samples are so warm and textured 🎧"),
    (0,4,"This is an excellent thread. The scaling laws paper from Chinchilla really changed how people think about training."),
    (2,5,"I needed to see this today. Starting my 5AM streak tomorrow!"),
]
created_comments = []
for ui, pi, content in comment_data:
    c = Comment(
        post_id=created_posts[pi].id,
        author_id=created_users[ui].id,
        content=content,
    )
    db.add(c)
    db.flush()
    created_comments.append(c)
db.commit()

# ── Communities ────────────────────────────────────────────────────────────────
communities_data = [
    {"name": "Design & Aesthetics", "category": "Design", "owner": 0,
     "description": "A space for UI/UX designers, graphic artists, and aesthetics lovers to share work, get feedback, and discuss trends.",
     "cover": "https://picsum.photos/seed/design-comm/1200/400"},
    {"name": "Developers Hub", "category": "Technology", "owner": 1,
     "description": "From frontend to backend, web to systems — all developers welcome. Share code, ask questions, find collaborators.",
     "cover": "https://picsum.photos/seed/dev-comm/1200/400"},
    {"name": "Photography World", "category": "Photography", "owner": 2,
     "description": "Share your captures, get constructive feedback, and discover the world through different lenses.",
     "cover": "https://picsum.photos/seed/photo-comm/1200/400"},
    {"name": "AI & Machine Learning", "category": "Technology", "owner": 4,
     "description": "Discussing papers, tools, model releases, and the future of artificial intelligence.",
     "cover": "https://picsum.photos/seed/ai-comm/1200/400"},
    {"name": "Music Makers", "category": "Music", "owner": 3,
     "description": "Producers, musicians, and music lovers connecting to share tracks, collaborate, and appreciate all genres.",
     "cover": "https://picsum.photos/seed/music-comm/1200/400"},
    {"name": "Fitness & Wellness", "category": "Health", "owner": 5,
     "description": "Support group for fitness goals, nutrition tips, mental wellness, and accountability partners.",
     "cover": "https://picsum.photos/seed/fitness-comm/1200/400"},
]

created_communities = []
for cd in communities_data:
    import re
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", cd["name"].lower())
    slug = re.sub(r"[\s]+", "-", slug.strip())
    slug = f"{slug}-{str(uuid.uuid4())[:6]}"
    c = Community(
        name=cd["name"], slug=slug, description=cd["description"],
        category=cd["category"], owner_id=created_users[cd["owner"]].id,
        cover_url=cd["cover"], privacy="public",
    )
    db.add(c)
    db.flush()
    db.add(CommunityMember(community_id=c.id, user_id=created_users[cd["owner"]].id, role="owner"))
    created_communities.append(c)

db.commit()

# Add some cross-memberships
cross_members = [(0,1),(1,0),(2,1),(3,4),(4,1),(4,0),(5,5),(0,2)]
for ui, ci in cross_members:
    existing = db.query(CommunityMember).filter(
        CommunityMember.community_id == created_communities[ci].id,
        CommunityMember.user_id == created_users[ui].id,
    ).first()
    if not existing:
        db.add(CommunityMember(community_id=created_communities[ci].id, user_id=created_users[ui].id))
db.commit()

# ── Conversations & Messages ───────────────────────────────────────────────────
conv1 = Conversation()
db.add(conv1)
db.flush()
db.add(ConversationMember(conversation_id=conv1.id, user_id=created_users[0].id))
db.add(ConversationMember(conversation_id=conv1.id, user_id=created_users[1].id))

messages1 = [
    (0, "Hey Bob! Loving the new chat feature you built 🔥"),
    (1, "Thanks Alice! The WebSocket part was tricky but worth it."),
    (0, "The typing indicators are so smooth. How'd you handle reconnection?"),
    (1, "Exponential backoff + a simple ping/pong heartbeat. Works like a charm!"),
    (0, "Smart. We should collab on the design system next 🎨"),
    (1, "100%! I'll ping you on Monday with some ideas."),
]
for ui, content in messages1:
    db.add(Message(conversation_id=conv1.id, sender_id=created_users[ui].id, content=content, is_read=True))

conv2 = Conversation()
db.add(conv2)
db.flush()
db.add(ConversationMember(conversation_id=conv2.id, user_id=created_users[2].id))
db.add(ConversationMember(conversation_id=conv2.id, user_id=created_users[0].id))
messages2 = [
    (2, "Alice, your design work is incredible! Do you do freelance?"),
    (0, "Thank you so much! I do take on select projects. What do you have in mind?"),
    (2, "I need a portfolio website for my photography. Nothing fancy but beautiful 📸"),
    (0, "That sounds like a perfect fit! Let's chat more this week ✨"),
]
for ui, content in messages2:
    db.add(Message(conversation_id=conv2.id, sender_id=created_users[ui].id, content=content, is_read=True))

db.commit()

# ── Notifications ──────────────────────────────────────────────────────────────
notif_data = [
    (0, 1, "follow", None, "Bob Martinez started following you"),
    (0, 2, "follow", None, "Carol Park started following you"),
    (0, 1, "like", None, "Bob Martinez liked your post"),
    (0, 4, "like", None, "Emma Johnson liked your post"),
    (1, 0, "comment", None, "Alice Chen commented on your post"),
    (2, 0, "like", None, "Alice Chen loved your photo"),
]
for ri, ai, nt, eid, msg in notif_data:
    db.add(Notification(
        recipient_id=created_users[ri].id,
        actor_id=created_users[ai].id,
        notification_type=nt,
        message=msg,
        is_read=False,
    ))
db.commit()
db.close()

print("[OK] Database seeded successfully!")
print("\nDemo accounts (all passwords: password123):")
for ud in users_data:
    print(f"  {ud['email']} -- @{ud['username']}")
