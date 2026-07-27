# Generates friendly, random organization names (e.g. "Bright Meadow") for users
# who sign up without an organization.
#
# Thread-safe by construction: the word lists are frozen and read-only, loaded
# once at boot, and picking uses SecureRandom + Array#sample, which hold no
# shared per-call state. This deliberately avoids the Enumerator/Fiber machinery
# of the former random-word gem, which raised FiberErrors when its shared,
# process-wide enumerator was advanced from multiple Puma threads concurrently.
module OrganizationNameGenerator
  WORDS_DIR = Rails.root.join("config/organization_names")

  ADJECTIVES = File.readlines(WORDS_DIR.join("adjectives.txt"), chomp: true).map(&:freeze).freeze
  NOUNS = File.readlines(WORDS_DIR.join("nouns.txt"), chomp: true).map(&:freeze).freeze

  def self.generate
    adjective = ADJECTIVES.sample(random: SecureRandom)
    noun = NOUNS.sample(random: SecureRandom)

    "#{adjective.capitalize} #{noun.capitalize}"
  end
end
