"""
Seed script — populates the SQLite database with realistic sample data.

Usage (from the backend/ directory):
    python seed.py

Safe to run multiple times: clears existing data before inserting.
"""
import sys
import os

# Ensure imports resolve correctly when run from the backend/ directory
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base, SessionLocal
from app.models import meeting, action_item, decision, key_point, notification  # noqa: F401 — register models
from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.models.decision import Decision
from app.models.key_point import KeyPoint
from app.models.notification import Notification


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Clear existing data ───────────────────────────────────────────
        db.query(Notification).delete()
        db.query(KeyPoint).delete()
        db.query(Decision).delete()
        db.query(ActionItem).delete()
        db.query(Meeting).delete()
        db.commit()

        # ── Meetings ──────────────────────────────────────────────────────
        meetings_data = [
            Meeting(
                title="Q4 Product Roadmap Review",
                date="2026-10-20",
                time="10:00",
                duration="90 min",
                category="Planning",
                participants="Alice Johnson,Bob Smith,Carol White,David Lee",
                description="Review and align on Q4 product priorities and launch targets.",
                summary="Reviewed Q4 roadmap, aligned on priorities, identified 3 key features for launch.",
                processing_status="completed",
            ),
            Meeting(
                title="Engineering Sprint Retrospective",
                date="2026-10-19",
                time="14:00",
                duration="60 min",
                category="Retrospective",
                participants="Bob Smith,Eve Davis,Frank Miller",
                description="Sprint 42 retrospective — what went well, what didn't.",
                summary="Sprint went well. Identified bottlenecks in code review process. Agreed to switch to bi-weekly cycles.",
                processing_status="completed",
            ),
            Meeting(
                title="Client Onboarding — Acme Corp",
                date="2026-10-18",
                time="11:00",
                duration="45 min",
                category="Client",
                participants="Carol White,Alice Johnson,John Acme",
                description="Walkthrough of product features for new client Acme Corp.",
                summary="Walked through product features. Client very engaged with analytics module. Potential upsell identified.",
                processing_status="completed",
            ),
            Meeting(
                title="Marketing Campaign Kickoff",
                date="2026-10-22",
                time="15:00",
                duration="60 min",
                category="Planning",
                participants="Grace Hall,Henry Park,Alice Johnson",
                description="Kickoff meeting for Q4 marketing campaign.",
                summary="",
                processing_status="pending",
            ),
            Meeting(
                title="Budget Review FY2027",
                date="2026-10-23",
                time="10:00",
                duration="120 min",
                category="Finance",
                participants="David Lee,Carol White,Alice Johnson",
                description="Annual budget planning and forecast for FY2027.",
                summary="",
                processing_status="pending",
            ),
            Meeting(
                title="Design System Workshop",
                date="2026-10-17",
                time="13:00",
                duration="180 min",
                category="Workshop",
                participants="Eve Davis,Frank Miller,Grace Hall",
                description="Collaborative workshop to establish the company design system.",
                summary="Established design token system. Agreed on component library approach using Tailwind CSS.",
                processing_status="completed",
            ),
            Meeting(
                title="Investor Update Call",
                date="2026-10-15",
                time="16:00",
                duration="60 min",
                category="Investor",
                participants="Alice Johnson,David Lee",
                description="Monthly investor update — metrics, milestones, and roadmap.",
                summary="Shared monthly metrics. Investors pleased with growth trajectory. Discussed Series B timeline.",
                processing_status="completed",
            ),
            Meeting(
                title="Security Audit Review",
                date="2026-10-24",
                time="09:00",
                duration="90 min",
                category="Technical",
                participants="Bob Smith,Frank Miller,Security Team",
                description="Review of recent security audit findings and remediation plan.",
                summary="",
                processing_status="pending",
            ),
        ]
        db.add_all(meetings_data)
        db.flush()  # get IDs without committing

        # Map titles to objects for FK references
        m = {mtg.title: mtg for mtg in meetings_data}

        # ── Action Items ──────────────────────────────────────────────────
        actions_data = [
            ActionItem(
                title="Update product roadmap document",
                description="Incorporate decisions from Q4 review into the master roadmap doc.",
                meeting_id=m["Q4 Product Roadmap Review"].id,
                owner="Alice Johnson",
                due_date="2026-10-25",
                priority="high",
                status="in_progress",
            ),
            ActionItem(
                title="Fix code review bottleneck in CI pipeline",
                description="Investigate and resolve the slow code review cycle causing sprint delays.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                owner="Bob Smith",
                due_date="2026-10-24",
                priority="high",
                status="pending",
            ),
            ActionItem(
                title="Prepare onboarding materials for Acme Corp",
                description="Create customized onboarding guide and video walkthrough.",
                meeting_id=m["Client Onboarding — Acme Corp"].id,
                owner="Carol White",
                due_date="2026-10-23",
                priority="medium",
                status="completed",
            ),
            ActionItem(
                title="Schedule follow-up with design team on tokens",
                description="Book a 30-min sync to finalize the color token decisions.",
                meeting_id=m["Design System Workshop"].id,
                owner="Eve Davis",
                due_date="2026-10-21",
                priority="low",
                status="overdue",
            ),
            ActionItem(
                title="Create investor deck for November update",
                description="Prepare slides covering MRR, DAU, churn, and product roadmap.",
                meeting_id=m["Investor Update Call"].id,
                owner="David Lee",
                due_date="2026-11-01",
                priority="high",
                status="pending",
            ),
            ActionItem(
                title="Review and merge authentication PR",
                description="Code review and merge of the OAuth2 authentication pull request.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                owner="Frank Miller",
                due_date="2026-10-22",
                priority="high",
                status="overdue",
            ),
            ActionItem(
                title="Send product demo recording to Acme",
                description="Export and share the demo session recording with Acme Corp team.",
                meeting_id=m["Client Onboarding — Acme Corp"].id,
                owner="Carol White",
                due_date="2026-10-26",
                priority="medium",
                status="pending",
            ),
            ActionItem(
                title="Define Q4 success metrics",
                description="Agree on KPIs and OKRs for Q4. Document in Notion.",
                meeting_id=m["Q4 Product Roadmap Review"].id,
                owner="Alice Johnson",
                due_date="2026-10-28",
                priority="medium",
                status="in_progress",
            ),
            ActionItem(
                title="Compile sprint velocity data",
                description="Pull sprint velocity stats from Jira for retrospective analysis.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                owner="Bob Smith",
                due_date="2026-10-20",
                priority="low",
                status="completed",
            ),
            ActionItem(
                title="Implement design token variables in codebase",
                description="Add Tailwind CSS design tokens to the shared component library.",
                meeting_id=m["Design System Workshop"].id,
                owner="Grace Hall",
                due_date="2026-11-05",
                priority="medium",
                status="pending",
            ),
        ]
        db.add_all(actions_data)

        # ── Decisions ─────────────────────────────────────────────────────
        decisions_data = [
            Decision(
                title="Adopt microservices architecture for v2.0",
                description="Team agreed to migrate monolith to microservices for better scalability. Migration to start Q1 2027.",
                meeting_id=m["Q4 Product Roadmap Review"].id,
                decision_date="2026-10-20",
                decided_by="Alice Johnson",
                impact="high",
                status="approved",
                tags="architecture,backend,Q4",
            ),
            Decision(
                title="Use GitHub Actions for CI/CD pipeline",
                description="Replace current Jenkins setup with GitHub Actions to reduce maintenance overhead and improve developer experience.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                decision_date="2026-10-19",
                decided_by="Bob Smith",
                impact="medium",
                status="approved",
                tags="devops,cicd,engineering",
            ),
            Decision(
                title="Standardize on Tailwind CSS for all new UI",
                description="All new frontend work will use Tailwind CSS. Legacy CSS to be migrated over 2 quarters.",
                meeting_id=m["Design System Workshop"].id,
                decision_date="2026-10-17",
                decided_by="Eve Davis",
                impact="medium",
                status="approved",
                tags="frontend,design,css",
            ),
            Decision(
                title="Extend Acme Corp contract by 6 months",
                description="Client requested extended engagement. Legal team to prepare amended contract.",
                meeting_id=m["Client Onboarding — Acme Corp"].id,
                decision_date="2026-10-18",
                decided_by="Carol White",
                impact="high",
                status="pending",
                tags="client,contract,acme",
            ),
            Decision(
                title="Allocate 20% of Q4 budget to security improvements",
                description="Post-audit finding: security investment insufficient. Team agreed to re-allocate budget.",
                meeting_id=m["Investor Update Call"].id,
                decision_date="2026-10-15",
                decided_by="David Lee",
                impact="high",
                status="approved",
                tags="security,budget,Q4",
            ),
            Decision(
                title="Implement bi-weekly sprint cycle",
                description="Switch from 3-week to 2-week sprint cycles starting November to improve delivery cadence.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                decision_date="2026-10-19",
                decided_by="Bob Smith",
                impact="low",
                status="approved",
                tags="process,agile,engineering",
            ),
        ]
        db.add_all(decisions_data)

        # ── Key Points ────────────────────────────────────────────────────
        key_points_data = [
            KeyPoint(
                content="Q4 will focus on three major features: real-time collaboration, AI summarization, and mobile app.",
                meeting_id=m["Q4 Product Roadmap Review"].id,
                category="highlight",
            ),
            KeyPoint(
                content="Sprint velocity dropped 18% compared to Sprint 41 due to review cycle delays.",
                meeting_id=m["Engineering Sprint Retrospective"].id,
                category="risk",
            ),
            KeyPoint(
                content="Acme Corp showed strong interest in the analytics dashboard — potential for premium tier upsell.",
                meeting_id=m["Client Onboarding — Acme Corp"].id,
                category="highlight",
            ),
            KeyPoint(
                content="Investors confirmed interest in leading Series B if ARR reaches $2M by Q1 2027.",
                meeting_id=m["Investor Update Call"].id,
                category="highlight",
            ),
        ]
        db.add_all(key_points_data)

        # ── Notifications ─────────────────────────────────────────────────
        notifications_data = [
            Notification(
                title="Action Item Overdue",
                message="'Schedule follow-up with design team on tokens' is overdue.",
                notification_type="warning",
                entity_type="action",
                is_read=False,
            ),
            Notification(
                title="Action Item Overdue",
                message="'Review and merge authentication PR' is overdue.",
                notification_type="warning",
                entity_type="action",
                is_read=False,
            ),
            Notification(
                title="New Meeting Scheduled",
                message="Budget Review FY2027 scheduled for 2026-10-23.",
                notification_type="info",
                entity_type="meeting",
                is_read=True,
            ),
            Notification(
                title="Decision Pending Approval",
                message="'Extend Acme Corp contract by 6 months' awaits approval.",
                notification_type="info",
                entity_type="decision",
                is_read=False,
            ),
        ]
        db.add_all(notifications_data)

        db.commit()
        print("[OK] Database seeded successfully!")
        print(f"   - {len(meetings_data)} meetings")
        print(f"   - {len(actions_data)} action items")
        print(f"   - {len(decisions_data)} decisions")
        print(f"   - {len(key_points_data)} key points")
        print(f"   - {len(notifications_data)} notifications")

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Seeding failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
