import AppDataSource from "../data-source";
import { User } from "../user/entities/user.entity";
import { Role } from "../user/entities/role.entity"; // <-- fixed import
import { Player } from "../player/entities/player.entity";
import { hashPassword } from "../utils/password";

export async function seedPlayer() {
  const userRepo = AppDataSource.getRepository(User);
  const playerRepo = AppDataSource.getRepository(Player);
  const roleRepo = AppDataSource.getRepository(Role);

  const phone = "252611111111";

  // Find the player role in Role table
  const playerRole = await roleRepo.findOneBy({ name: "player" });
  if (!playerRole) {
    console.log("Player role missing. Run the role seed first!");
    return;
  }

  // Check if player user already exists
  const existingUser = await userRepo.findOneBy({ username: phone });
  if (existingUser) {
    console.log("Player user already exists. Skipping player seed.");
    return;
  }

  const passwordHash = await hashPassword("player123");

  // Create new user (role: player)
  const user = userRepo.create({
    username: phone, // username is the phone number for players
    phoneNumber: phone,
    passwordHash,
    isActive: true,
    role: playerRole,          // <-- use Role entity!
    firstName: "Player",
    middleName: null,
    lastName: "One",
    email: "player1@example.com"
  });
  await userRepo.save(user);

  // Create new player and link to user
  const player = playerRepo.create({
    user: user,
    efootballId: "efb_001",
    efootballUsername: "PlayerOne",
    avatarUrl: null,
  });
  await playerRepo.save(player);

  console.log("Demo player seeded!");
}