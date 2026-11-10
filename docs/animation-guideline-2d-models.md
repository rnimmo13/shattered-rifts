You are an expert Frontend Developer and 2D Motion Designer specializing in high-performance web animations. I have attached a 2D character image in a static A-pose. Your task is to dynamically parse, rig, and animate this character using pure code inside a single, self-contained HTML file.

--- 1. ANALYSIS & VECTORIZATION ---
- Closely analyze the attached character image. Map its visual aesthetics, including its color palette, line art style, and proportions.
- Mentally segment the character into functional layer groups: Head, Torso, Left Arm (Upper/Lower), Right Arm (Upper/Lower), Left Leg, Right Leg.
- Recreate these segments precisely using code (Inline SVGs or HTML5 Canvas drawing paths) to rebuild the character dynamically from the reference image.

--- 2. RIGGING & ANCHOR POINTS ---
- Rig the character using strict hierarchical parenting so body parts move organically without breaking apart.
- Explicitly set transform-origin anchor points at the logical anatomical joints:
  * Neck: bottom-center of the head
  * Shoulders: top-left / top-right of the torso
  * Elbows / Wrists: mid-limb segments
  * Hips: bottom-left / bottom-right of the pelvis
  * Knees: mid-leg segments

--- 3. STEP-BY-STEP ANIMATION LOOP ---
- Do not use cross-dissolves or fades. Elements must transform seamlessly using physics-based motion.
- Implement smooth, natural easing using cubic-bezier curves (e.g., cubic-bezier(0.4, 0, 0.2, 1)) or GSAP's power2.inOut. Avoid static linear movement.
- Animate the character performing the following cyclic routine over a continuous 6-second timeline:
  * [0s - 1.5s]: Shift from the static A-pose into a lively idle breathing stance (subtle torso bobbing up/down, minor hair/accessory secondary animation).
  * [1.5s - 4.5s]: Execute a smooth, stylized action loop (e.g., a wave, a confident walk cycle, or a joyful jump) ensuring joints rotate naturally without clipping the joints.
  * [4.5s - 6s]: Settle fluidly back into the starting stance, creating an infinite, seamless loop.

--- 4. SYSTEM OUTPUT REQUIREMENTS ---
- Combine everything into a single, copy-pasteable HTML file containing structural elements, styled containers, and execution logic.
- Deliver a responsive viewport (16:9 aspect ratio, centered on a clean background).
- Do not provide code explanations, intro text, or conversational commentary. Output ONLY the raw code blocks.
