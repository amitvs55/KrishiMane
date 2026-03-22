"""
KrishiMane AI Advisor — LangGraph Agent
Uses Google Gemini via langchain-google-genai
"""

from typing import Annotated, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

load_dotenv()

# ─── LLM ───────────────────────────────────────────────────────────────────
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
    streaming=True,
)

# ─── Knowledge Base ─────────────────────────────────────────────────────────
PRODUCT_KB = """
=== KrishiMane Product Knowledge Base ===

1. SAFFLOWER OIL (Kardi Oil)
   - Type: Cold-pressed, unrefined
   - Fatty acids: Linoleic acid ~74%, Oleic ~13%, Saturated ~8%
   - Vitamin E: Very high (34mg per 100g)
   - Smoke point: 265°C (very high — great for frying)
   - Best for: High-heat cooking, deep frying, salad dressings, skincare
   - Health: Lowers LDL cholesterol, anti-inflammatory, supports skin health
   - Taste: Light, neutral flavour
   - NOT suitable for: Those with ragweed pollen allergy

2. SUNFLOWER OIL
   - Type: Cold-pressed, unrefined
   - Fatty acids: Linoleic acid ~68%, Oleic ~20%, Saturated ~11%
   - Vitamin E: High (41mg per 100g) — highest among our range
   - Smoke point: 232°C (high)
   - Best for: Everyday cooking, baking, stir-fry, salad dressings
   - Health: Rich antioxidants, supports immune function, skin health
   - Taste: Light, mild nutty flavour

3. GROUNDNUT OIL (Peanut Oil)
   - Type: Wood-pressed (chekku), unrefined
   - Fatty acids: Oleic (~46%), Linoleic (~32%), Saturated (~17%)
   - Vitamin E: Moderate (15mg per 100g)
   - Smoke point: 232°C (high)
   - Best for: Deep frying, Indian curries, tadka/tempering, stir-fry
   - Health: Monounsaturated fats for heart health, resveratrol content
   - Taste: Rich, nutty, aromatic — traditional Indian kitchen staple
   - Caution: Avoid if peanut allergy

4. COCONUT OIL (Virgin Coconut Oil)
   - Type: Cold-pressed, virgin, unrefined
   - Fatty acids: Saturated ~90% (mostly MCTs — lauric, caprylic, capric acid)
   - Smoke point: 177°C (medium — best for gentle cooking)
   - Best for: Low-medium heat cooking, baking, hair care, skin moisturiser
   - Health: MCTs for quick energy, lauric acid antimicrobial, promotes good HDL
   - Taste: Pleasant coconut aroma
   - Note: High saturated fat — best in moderation for heart patients

=== Comparison Guides ===
- For HEART HEALTH: Safflower > Sunflower > Groundnut (in that order)
- For DEEP FRYING: Safflower = Groundnut > Sunflower (all good; avoid coconut)
- For HAIR & SKIN: Coconut Oil (best), Sunflower (good)
- For INDIAN COOKING / TADKA: Groundnut Oil (authentic flavour)
- For WEIGHT MANAGEMENT: Coconut (MCTs), Sunflower (moderate calories)
- For DIABETICS: Sunflower or Safflower (high linoleic helps insulin sensitivity)

=== Brand Info ===
- All oils: 100% natural, cold/wood pressed, zero additives or preservatives
- Sourced from Karnataka & Andhra Pradesh family farms
- FSSAI certified, lab tested for purity
- Available in 500ml, 1L, 5L glass/plastic bottles
- Order: Visit krishimane.in or call our farm helpline
"""

# ─── State ───────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    intent: str

# ─── Nodes ───────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = f"""You are KrishiMane's friendly and knowledgeable AI Advisor. 
KrishiMane is a premium Indian agricultural brand selling cold-pressed natural oils.

Your role:
- Help customers choose the right oil for their health needs, cooking style, dietary preferences
- Explain nutritional benefits and differences clearly
- Be warm, helpful, and concise. Use occasional emojis 🌿
- Always stay on topic (oils, health, cooking, KrishiMane products)

Here is your complete product knowledge base:
{PRODUCT_KB}

Always recommend specific KrishiMane products where relevant. 
Keep answers concise (2-4 paragraphs max unless detailed comparison is requested).
"""

def intent_classifier(state: AgentState) -> AgentState:
    """Classify user intent to route to appropriate handler."""
    last_msg = state["messages"][-1].content.lower()
    
    if any(w in last_msg for w in ["recommend", "best", "suggest", "should i", "which", "compare", "vs", "versus"]):
        intent = "recommend"
    elif any(w in last_msg for w in ["health", "benefit", "nutrition", "vitamin", "omega", "fat", "cholesterol", "heart", "diabetes", "weight"]):
        intent = "health"
    elif any(w in last_msg for w in ["cook", "fry", "bake", "smoke", "heat", "recipe", "tadka", "curry"]):
        intent = "cooking"
    else:
        intent = "general"
    
    return {**state, "intent": intent}


def advisor_node(state: AgentState) -> AgentState:
    """Main advisor — handles all intents using the product KB."""
    history = state["messages"]
    
    # Build message list with system prompt
    langchain_msgs = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in history:
        if isinstance(msg, HumanMessage):
            langchain_msgs.append(HumanMessage(content=msg.content))
        elif isinstance(msg, AIMessage):
            langchain_msgs.append(AIMessage(content=msg.content))
    
    response = llm.invoke(langchain_msgs)
    return {**state, "messages": [response]}


def router(state: AgentState) -> Literal["advisor"]:
    """Route based on intent — all go to advisor (extensible)."""
    return "advisor"


# ─── Graph ───────────────────────────────────────────────────────────────────
def build_graph():
    g = StateGraph(AgentState)
    g.add_node("intent_classifier", intent_classifier)
    g.add_node("advisor", advisor_node)
    
    g.set_entry_point("intent_classifier")
    g.add_conditional_edges("intent_classifier", router)
    g.add_edge("advisor", END)
    
    return g.compile()


graph = build_graph()


# ─── Public API ──────────────────────────────────────────────────────────────
def create_initial_state(message: str, history: list[dict]) -> AgentState:
    """Convert chat history + new message into LangGraph state."""
    messages = []
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h["role"] == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=message))
    return {"messages": messages, "intent": ""}
