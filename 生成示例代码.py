import requests
import json
import os

# APIYI Platform Configuration
APIYI_BASE_URL = "xxx"
APIYI_API_KEY = "your_api_key_here"  # Obtain from apiyi.com

def generate_game_asset(prompt, style="pixel-art", seed=None, size="512x512"):
    """
    Generate Game Assets Using Nano Banana Pro

    Parameters:
        prompt: Prompt description
        style: Style code (pixel-art, cartoon, realistic)
        seed: Seed value, fixed generation result
        size: Image size (512x512, 1024x1024)
    """
    headers = {
        "Authorization": f"Bearer {APIYI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gemini-2.0-flash-imagen",
        "prompt": f"{prompt}, {style} style, game asset",
        "size": size,
        "n": 1
    }

    if seed:
        payload["seed"] = seed

    response = requests.post(
        f"xxx",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        result = response.json()
        image_url = result["data"][0]["url"]
        return image_url
    else:
        raise Exception(f"Generation Failed: {response.text}")

# Batch Generate Weapon Assets Example
weapon_types = ["sword", "axe", "spear", "bow", "staff"]
base_prompt = "A fantasy {weapon} with magical effects, game item icon, white background, front view"

for weapon in weapon_types:
    prompt = base_prompt.format(weapon=weapon)
    image_url = generate_game_asset(
        prompt=prompt,
        style="pixel-art-16bit",
        seed=12345,  # Fixed seed ensures style consistency
        size="512x512"
    )

    # Download image to local
    img_data = requests.get(image_url).content
    with open(f"assets/weapons/{weapon}.png", "wb") as f:
        f.write(img_data)

    print(f"✓ Generated: {weapon}.png")