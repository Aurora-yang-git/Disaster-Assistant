# Mazu Demo Script - Google Gemma Developer Contest

## Opening (10 seconds)
**Visual:** Mazu logo with tagline
**Narration:** "When networks fail, Mazu remains. Let me show you how."

---

## Demo 1: Offline Capability (50 seconds)

### Setup (5 seconds)
**Visual:** Split screen with 2 phones
- Left: ChatGPT app
- Right: Mazu app

**Narration:** "First, let's test what happens when disaster strikes and networks fail."

### The Test (30 seconds)

**Step 1: Show both phones online**
- Both apps open and ready

**Step 2: Toggle Airplane Mode**
**Visual:** Presenter's hand physically toggles airplane mode ON for both phones
- Show ✈️ icons appearing on both status bars

**Step 3: First Query**
**Type on both:** "I'm trapped after an earthquake. What should I do first?"

**Results:**
- **ChatGPT:** Red error screen "Network Error - Unable to connect"
- **Mazu:** Immediate response with emergency guidance

**Step 4: Prove It's Not Canned (KEY MOMENT)**
**Narration:** "No canned responses here. Let's ask something different."

**Type on both:** "Building collapsed on me. Can't move. Help"

**Mazu responds differently but intelligently:**
```
🔴 EMERGENCY - TRAPPED SURVIVOR PROTOCOL

IMMEDIATE ACTIONS:
1. STOP moving - assess injuries before any movement
2. Control breathing - panic wastes oxygen
3. Create noise: Find metal/stone, tap 3 times, wait, repeat
4. Protect airways: Cover nose/mouth with fabric

Can you move your fingers and toes? (Testing for spinal injury)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 0.8s | 92 tokens | 115 tok/s (= full text in under 1 second)
```

### Technical Proof (15 seconds)
**Show overlay:**
```
✓ Model: gemma-3n-E2B-it-Q4_K_M.gguf (2.3GB)
✓ Running on: iPhone 15 Pro Neural Engine
✓ Zero network packets sent
✓ Inference speed: 115 tokens/second
```

---

## Demo 2: Context Persistence (45 seconds)

### Setup (5 seconds)
**Visual:** Single phone, Mazu app with Context Panel visible (empty)
**Narration:** "Mazu remembers critical details without any cloud storage."

### Building Context (25 seconds)

**User 1:** "I'm in my basement. The power is out and I smell gas."

**Mazu response:**
```
⚠️ GAS LEAK DANGER - Act immediately:

1. Do NOT flip any switches or use electronics
2. Do NOT light matches or create sparks
3. Open windows if possible (don't use electric openers)
4. Exit immediately - stay low where air is cleaner

Are you alone? Can you safely reach an exit?
```

**Context Panel Updates:**
```json
📍 Location: Basement
⚠️ Hazards: Gas leak, No power
🚨 Priority: Immediate evacuation
```

**User 2:** "I have my wife and our 6-month-old baby with me"

**Context Panel Updates:**
```json
📍 Location: Basement
👥 Occupants: 2 adults, 1 infant (6mo)
⚠️ Hazards: Gas leak, No power
🚨 Priority: Evacuate with infant care
```

### The Payoff - Proving Memory (15 seconds)

**User 3:** "I hear a hissing sound. What should we do?"

**Mazu synthesizes ALL context:**
```
CRITICAL - Hissing confirms active gas leak!

With your 6-month-old baby:
1. Wife should carry baby, cover baby's face loosely with cloth
2. You lead the way, staying LOW (gas rises)
3. Exit NOW - every second increases danger
4. Do NOT use phone flashlight - any spark could ignite
5. Once outside, move far from building (minimum 100 feet)

The baby is most vulnerable - prioritize getting outside immediately!
```

**Technical Note:** 
"Notice Mazu remembered all three critical facts: basement location, gas leak, and the infant - synthesizing a prioritized escape plan. This happens entirely on-device through Gemma 3n's context window."

---

## Demo 3: RAG Knowledge Base (50 seconds)

### Setup (5 seconds)
**Visual:** Knowledge base indicator showing "📚 Earthquake Survival Knowledge Base"
**Narration:** "We've embedded comprehensive earthquake survival protocols from seismic experts and disaster response agencies directly on your phone."

### Simple Query with Debug View (15 seconds)

**User:** "Should I run outside during the earthquake?"

**Show RAG Process:**
```
🔍 Embedding query...
📊 Searching earthquake knowledge base...
✅ Top matches:
  1. earthquake_immediate_response.md (0.96)
  2. building_evacuation_myths.md (0.93)
```

**Mazu Response with Citation:**
```
❌ NO - Running outside is extremely dangerous!

Most injuries occur from:
- Falling debris from buildings
- Breaking glass from windows
- Tripping while running

✅ INSTEAD: Drop, Cover, Hold On where you are

[Source: USGS Earthquake Hazards Program]
```

### The Ultimate Test - Complex Earthquake Scenario (30 seconds)

**Narration:** "But can it handle complex, multi-factor earthquake situations?"

**User:** "I'm on the 20th floor, building is swaying, and I smell gas"

**Show Multi-Document RAG:**
```
🔍 Complex query detected...
📊 Synthesizing from earthquake knowledge base:
  - high_rise_earthquake_response.md (0.94)
  - gas_leak_protocols.md (0.92)  
  - aftershock_safety.md (0.89)
  - evacuation_timing.md (0.87)
```

**Mazu's Synthesized Response:**
```
⚠️ MULTIPLE HAZARDS - Prioritized Response:

IMMEDIATE (During shaking):
1. DROP under sturdy desk - high floors sway more
2. HOLD ON - furniture will slide
3. Stay PUT - never use stairs during quake

AFTER shaking stops:
1. Gas smell = extreme danger on high floor
2. Do NOT use elevators (even if working)
3. Open windows for ventilation (gas rises)
4. Use stairs ONLY after shaking fully stops
5. Exit building - aftershocks + gas = deadly

[Synthesized from: Japan Building Code, USGS High-Rise Guidelines, 
LA Fire Dept Gas Emergency Protocols]
```

**Narration:** "Notice how it prioritized multiple dangers - the height, the gas leak, and potential aftershocks - into a time-sequenced action plan. This depth of earthquake expertise is what makes Mazu invaluable."

---

## Closing (15 seconds)

**Visual:** Three phones showing each demo
**Narration:** 

"We've just shown you three things:

1. **Our AI works when all others fail.** (Offline)
2. **It remembers your critical situation.** (Context)  
3. **It gives expert, verifiable advice you can trust with your life.** (RAG)

All of this happens right here, on a standard phone, with no connection to the cloud. 

This isn't just an app. It's a resilient lifeline.

**This is Mazu.**"

**Final Visual:** Mazu logo with "Powered by Gemma 3n"

---

## Technical Addendum for Judges
- Model: gemma-3n-E2B-it-Q4_K_M.gguf (2.3GB, 4-bit quantized)
- Inference: 90-115 tokens/second on mobile hardware
- Context: 8,192 token window maintained on-device
- Knowledge: Comprehensive earthquake survival knowledge base
- Stack: React Native + llama.rn + custom RAG pipeline
- Focus: Deep expertise in earthquake response while maintaining general emergency capabilities