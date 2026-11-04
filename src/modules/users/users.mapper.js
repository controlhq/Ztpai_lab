// whitelista pól - passwordHash nigdy nie trafia do odpowiedzi
function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = { toUserResponse };
