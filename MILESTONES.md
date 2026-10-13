Milestones: 

#1 march 11
the pivot from privacy/security company that sells hardware into a software only company due to the discovery of Agentic coding.

#2 20 april 
the first AI pipeline built by myself, focusing on ASR in vaultwares-realtime/vaultwares-video-processing. 

#3 May 6th 
the first time I tried Claude, which would become by far the best agent as soon as Opus 4.7 released until now, and the phasing out of ChatGPT which for some reason became second tier to me, on the same level as devin/cascade/mistral (needs supervision, would not trust alone with projects that I value), leaving only Claude and Gemini as "trusted models that will probably make the right decision". 

That is probably mostly due to the harness and not the model's "raw" capabilities which i find pretty much the same between the flagships. Codex has frontier models but the harness seemed to gradually fall off while Claude just got insanely ahead of everyone with the release of Opus 5.5. Gemini 3.8 was still okay but had incredible speed at very low price and recklessness, which sometimes can be useful. Devin/cascade on the other hand has a very solid harness but much less usage and lower models are visibly "restrained" i guess, you can feel the difference in computing power when even their "flagship" SWE-2 gets stuck in thought loops.
Mistral was just bad, at 15$/month it was only somewhat better than a local openClaw agent (8B LLM) and the same price as Copilot. But on june 1, copilot just decided to remove like 95% of its usage, it took 4 messages in ~2 hours to burn my monthly quota so i never went back.

I kind of went off tracks but this will all be useful, maybe not for stats but for the narrative. At some point we'll have to describe the environment and dive a bit deeper into each agents, what i learned  and so on. It's important to note also that this is a fully autonomous environment from the start, no sandboxes, full permissions and access to my PC and VPSes, sometimes also full creative reins on a whole project. Part of the goal was to test the limits of the harness/guardrails to hopefully show that you can give more autonomy to agents, even if you're a "serious" company unlike VaultWares which has no cash flow or clients. 

After all this i would definitely let any of claude/gemini/codex have full access to my codebase, the productivity gains are so important that the few mishaps that happened were insignificant.
And if i used Dev servers and git branches instead of "coding on main, on PROD, with a single local copy" more than half of the time, nothing bad would have happened.
But that was necessary to test the limits and the results are much much better than i would have expected; deployments are so-so on prod (obviously) but still 90% successful i'd say and 1 time mistral deleted typescript files while cleaning up video files (.ts), so back in june Le Chat was not to be trusted alone. 

#4 May 12th 
the beginning of our expansion with the rental of greencloud (and just.hosting which was replaced by OVH Cloud) and the integration of tailscale as a vital part of everything VaultWares.