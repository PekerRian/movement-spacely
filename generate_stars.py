import random

def get_shadows(n, color):
    return ', '.join([f'{random.randint(0, 2000)}px {random.randint(0, 2000)}px {color}' for _ in range(n)])

shadows_small = get_shadows(700, '#ffd700')
shadows_medium = get_shadows(200, '#ffed4e')
shadows_large = get_shadows(100, '#ffb700')

css_content = f"""
.stars-container {{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}}

.stars {{
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: {shadows_small};
    animation: animStar 50s linear infinite;
}}

.stars:after {{
    content: " ";
    position: absolute;
    top: 2000px;
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: {shadows_small};
}}

.stars2 {{
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: {shadows_medium};
    animation: animStar 100s linear infinite;
}}

.stars2:after {{
    content: " ";
    position: absolute;
    top: 2000px;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: {shadows_medium};
}}

.stars3 {{
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: {shadows_large};
    animation: animStar 150s linear infinite;
}}

.stars3:after {{
    content: " ";
    position: absolute;
    top: 2000px;
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: {shadows_large};
}}

@keyframes animStar {{
    from {{
        transform: translateY(0px);
    }}
    to {{
        transform: translateY(-2000px);
    }}
}}
"""

with open('src/stars.css', 'w') as f:
    f.write(css_content)
