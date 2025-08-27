from .auth_route import auth_bp
from .recommend_route import recommend_bp
from .preference_route import preference_bp
from .community_route import community_bp
from .profile_route import profile_bp
from .write_route import write_bp
from .search_route import search_bp
from .chart_route import chart_bp

# Blueprint
blueprints = [
    auth_bp,
    recommend_bp,
    preference_bp,
    community_bp,
    profile_bp,
    write_bp,
    search_bp,
    chart_bp
]
