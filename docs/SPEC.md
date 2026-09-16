# UPPDRAG: BYGG AIP ULTIMATE FIGHTER

Du är ansvarig utvecklare, teknisk arkitekt, fighting game-designer och QA för
ett komplett webbläsarspel med titeln:

AIP Ultimate Fighter

Spelet är en rolig, gemensam kontorsaktivitet för Aros IT Partner.
Karaktärerna ska senare vara godkända karikatyrer av medarbetarna.
Vi skapar de slutliga 3D-modellerna senare, huvudsakligen med Tripo3D eller Meshy.

Din uppgift är att BYGGA, KÖRA, TESTA och FÄRDIGSTÄLLA spelet.
Leverera inte enbart en plan, mockup, kodskiss eller ofärdig demonstration.

## 1. ARBETSSÄTT OCH SJÄLVSTÄNDIGHET

Arbeta igenom hela flödet:

Undersök → Implementera → Kör → Testa → Inspektera → Reparera → Testa igen.

Fortsätt automatiskt mellan delmålen utan att fråga om lov för varje steg.
Välj rimliga standardvärden när detaljer saknas och dokumentera besluten.

Avsluta inte bara för att:
- Projektet startar.
- En startsida finns.
- Två modeller syns.
- En lokal match fungerar.
- Första delmålet är färdigt.
- Dokumentationen beskriver funktioner som ännu inte är implementerade.

Använd tillgängliga verktyg för att faktiskt inspektera webbläsaren,
serverloggarna, nätverkstrafiken och testresultaten.

Verifiera installerade paketversioner och relevanta officiella API:er innan
du bygger på dem. Gissa inte metodnamn från äldre exempel.

Vid fel ska du undersöka orsaken innan du lägger till fler funktioner.
Gör inte samma misslyckade försök om och om igen utan ny information.
Försvaga inte tester för att dölja ett riktigt fel.

Respektera projektets gränser:
- Rör inte andra projekt eller orelaterad infrastruktur.
- Läs inte ut eller publicera hemligheter.
- Köp inte tjänster och starta inte betalda genereringar.
- Publicera inte medarbetarbilder till externa tjänster.
- Gör inte destruktiva systemändringar för att kringgå ett byggfel.
- Driftsätt endast till en redan tillåten projektmiljö.

Om extern åtkomst, domän, certifikat, tenantkonfiguration eller inloggningsuppgifter
saknas ska du slutföra allt oberoende arbete och dokumentera exakt vad som
blockerar den externa verifieringen. Hitta inte på att den är genomförd.

Vid en faktisk sessions- eller verktygsgräns ska arbetsläget vara sparat så
att nästa körning fortsätter där du slutade. Påstå inte att arbetet fortsätter
utan en aktiv exekveringsmiljö.

## 2. VAD DEN FÄRDIGA VERSIONEN SKA VARA

Bygg ett lättillgängligt men ordentligt fungerande 2,5D-fightingspel.

Grundkrav:
- Två människor ska kunna spela mot varandra från olika webbläsare.
- Spelet ska även ha lokalt tvåspelarläge och ett enkelt träningsläge.
- All spelkod och backendlogik ska skrivas i TypeScript.
- Spelare rör sig på ett 2D-plan.
- Karaktärerna renderas som animerade 3D-modeller.
- Bakgrunden består av 2D-bilder med parallax.
- Spelet ska kunna bäddas in i SharePoint.
- En server ska äga spelarplatser, kö, matchförlopp och matchresultat.
- De slutliga medarbetarmodellerna ska kunna läggas till utan att stridsmotorn
  behöver skrivas om.

Version 1 ska innehålla åtta spelbara karaktärsprofiler:
- Två zoners.
- Två shotos.
- Två grapplers.
- Två hybrider.

Börja implementationen med två karaktärer, men slutför samtliga åtta profiler
innan version 1 markeras färdig.

De slutliga medarbetarmodellerna är INTE ett krav för att färdigställa version 1.
Leverera i stället tydliga, animerade 3D-platshållare som går att byta ut.
Platshållarna ska fungera som riktiga fighters, inte som stillastående kapslar.

Bygg inte följande i version 1:
- Rankat matchmaking-system.
- Global turneringsplattform.
- Betalningar, butik eller upplåsningssystem.
- Avancerad karaktärseditor.
- Kampanj eller story mode.
- Fotorealistiska miljöer.
- Generativ AI under pågående strid.
- Universell automatisk riggning av godtyckliga modeller.
- Fullständig mobil touchstyrning.

Arkitekturen ska vara utbyggbar, men bygg inte funktioner bara för att de
eventuellt kan behövas i framtiden.

## 3. FAST TEKNISK BAS

Använd följande grund om inte projektets faktiska miljö ger ett konkret,
verifierat hinder:

- TypeScript med strict-kontroller.
- Vite för webbklienten.
- React för menyer, lobby, inställningar och verktyg.
- Three.js för spelrenderingen.
- Node.js i en aktuell kompatibel LTS-version.
- Colyseus för rum, anslutningar och serverkommunikation.
- WebSocket/WSS som primär transport.
- Zod eller motsvarande för validering av externa data.
- Vitest för enhets- och integrationstester.
- Playwright för webbläsartester.
- pnpm workspace och en committad lockfil.

Lås kompatibla versioner. Uppgradera inte bibliotek mitt under arbetet utan
ett verkligt skäl och efterföljande regressionstest.

Föreslagen struktur:

apps/web
apps/server
packages/sim
packages/contracts
packages/content
tools/assets
tests/e2e
docs

Ansvarsfördelning:
- sim innehåller den rena stridssimuleringen.
- contracts innehåller protokoll, scheman och gemensamma identifierare.
- content innehåller spelregler, movesets och karaktärsdefinitioner.
- web presenterar spelet och samlar input.
- server äger nätmatchernas auktoritativa tillstånd.
- tools/assets hanterar validering och import av karaktärspaket.

Lägg inte spelmekanik i React-komponenter.
Driv inte animation eller stridslogik med React state-uppdateringar per bildruta.
Ha inte separata kopior av stridsmotorn på klient och server.

Ingen databas krävs för aktiva matcher i version 1.
Karaktärspaket och konfiguration ska däremot vara beständiga och versionshanterade.

Använd små, begripliga moduler. Bygg inte ett generellt spelmotorframework
som är större än själva spelet.

## 4–22

Övriga krav (stridssimulering, hitboxes, attacker, ronder, nät, lobby, åtta
karaktärer, Character Lab, animation, arena, UI, SharePoint, säkerhet,
prestanda, tester, genomförandeordning, arbetsminne och definition of done)
följer originaluppdraget i chatten och konkretiseras i:

- docs/COMBAT_RULES.md
- docs/NETWORKING.md
- docs/CHARACTER_IMPORT.md
- docs/BALANCE.md
- docs/DEPLOYMENT.md
- docs/SHAREPOINT.md
- docs/QA_REPORT.md
- docs/DECISIONS.md

Kort definition of done för version 1:

- Två människor kan spela från separata webbläsare.
- Exakt två aktiva slots på servern.
- Första spelaren kan välja sida; andra får återstående.
- Åskådare och FIFO-kö fungerar.
- Hela matchflödet fungerar flera matcher i rad.
- Grundhandlingar, block, kast, specials och super fungerar.
- Åtta profiler med fyra arketyper går att spela.
- Motorn är deterministisk och återställningsbar.
- 3D-animationer synkas mot gameplayfaser.
- Character Lab och import fungerar.
- Parallax, HUD, inställningar och ljud finns.
- Spelet byggs och startas från ren checkout.
- Kritiska tester är gröna.
- Inga kända P0/P1-fel göms bakom dokumentation.
