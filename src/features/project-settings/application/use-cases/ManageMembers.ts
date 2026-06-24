import { inviteSchema, memberUpdateSchema, type InviteInput, type MemberUpdateInput } from "../schemas";
import { isLeadershipRole } from "../../domain/catalog";
import type { IMemberRepository, IAuditRepository } from "../../domain/repositories";
import type { ProjectInvitation, ProjectMember } from "../../domain/entities";
import { UserFacingError } from "@/server/lib/errors";

export interface MemberDeps {
  memberRepository: IMemberRepository;
  auditRepository: IAuditRepository;
}

export class UpdateMember {
  constructor(private readonly deps: MemberDeps) {}

  async execute(
    workspaceId: string,
    memberId: string,
    actorId: string,
    input: MemberUpdateInput
  ): Promise<ProjectMember> {
    const parsed = memberUpdateSchema.parse(input);

    // Leadership guard: demoting/removing the last active leader is blocked.
    if (parsed.status === "inactive" || (parsed.permissionRole && parsed.permissionRole === "member")) {
      const leaders = await this.deps.memberRepository.countActiveLeaders(workspaceId);
      const current = await this.deps.memberRepository.list(workspaceId);
      const target = current.find((m) => m.id === memberId);
      const isCurrentlyLeader =
        target && (target.permissionRole === "leader" || target.permissionRole === "admin");
      const wouldLoseLeadership =
        isCurrentlyLeader &&
        ((parsed.status === "inactive") ||
          (parsed.permissionRole && parsed.permissionRole === "member"));
      if (wouldLoseLeadership && leaders <= 1) {
        throw new UserFacingError(
          "No puedes dejar el proyecto sin líderes. Asigna otro líder primero.",
          409
        );
      }
    }

    const before = await this.deps.memberRepository.list(workspaceId);
    const beforeRow = before.find((m) => m.id === memberId) ?? null;
    const updated = await this.deps.memberRepository.update(memberId, {
      projectRole: parsed.projectRole,
      permissionRole: parsed.permissionRole,
      status: parsed.status,
    });

    await this.deps.auditRepository.record({
      workspaceId,
      actorId,
      action: "member.update",
      entity: "member",
      entityId: memberId,
      before: beforeRow,
      after: updated,
    });

    return updated;
  }
}

export class RemoveMember {
  constructor(private readonly deps: MemberDeps) {}

  async execute(workspaceId: string, memberId: string, actorId: string): Promise<void> {
    const current = await this.deps.memberRepository.list(workspaceId);
    const target = current.find((m) => m.id === memberId);
    if (!target) {
      throw new UserFacingError("No encontramos a esa persona en el proyecto.", 404);
    }
    const isLeader = target.permissionRole === "leader" || target.permissionRole === "admin";
    const leaders = await this.deps.memberRepository.countActiveLeaders(workspaceId);
    if (isLeader && leaders <= 1) {
      throw new UserFacingError(
        "No puedes eliminar al último líder del proyecto.",
        409
      );
    }
    await this.deps.memberRepository.remove(memberId);
    await this.deps.auditRepository.record({
      workspaceId,
      actorId,
      action: "member.remove",
      entity: "member",
      entityId: memberId,
      before: target,
    });
  }
}

export class InviteMember {
  constructor(private readonly deps: MemberDeps) {}

  async execute(
    workspaceId: string,
    actorId: string,
    input: InviteInput
  ): Promise<ProjectInvitation> {
    const parsed = inviteSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();
    const exists = await this.deps.memberRepository.emailExists(workspaceId, email);
    if (exists) {
      throw new UserFacingError(
        "Ese correo ya pertenece a alguien del proyecto.",
        409
      );
    }
    const invitation = await this.deps.memberRepository.invite(
      workspaceId,
      email,
      parsed.projectRole ?? null,
      actorId
    );
    await this.deps.auditRepository.record({
      workspaceId,
      actorId,
      action: "member.invite",
      entity: "member",
      entityId: invitation.id,
      after: invitation,
    });
    return invitation;
  }
}

export class RevokeInvitation {
  constructor(private readonly deps: MemberDeps) {}

  async execute(workspaceId: string, invitationId: string, actorId: string): Promise<void> {
    await this.deps.memberRepository.revokeInvitation(invitationId);
    await this.deps.auditRepository.record({
      workspaceId,
      actorId,
      action: "member.revoke_invite",
      entity: "member",
      entityId: invitationId,
    });
  }
}

export { isLeadershipRole };
