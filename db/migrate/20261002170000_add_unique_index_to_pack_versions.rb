# Gives pack_versions the unique key a restore needs to recognise a row it has seen before.
#
# PackVersion#set_version_number already assigns `version` as a per-pack counter under an
# advisory lock, so (pack_id, version) has been a natural key all along -- it simply was not
# declared as one, and Tenant::RestorePlanner only trusts what the database enforces.
#
# The key deliberately does not involve `id`, because a restore drops integer ids and lets the
# sequence reassign them -- a key containing one could never match.
#
# This index was originally the *whole* change for this table, on the grounds that declaring an
# existing natural key is cheaper than swapping a primary key. That turned out to be enough for a
# restore to recognise a pack version but not to keep its bundle, so the swap happens too -- see
# 20261002170500_migrate_pack_version_to_npi_pk.rb. The index stays regardless: a pack having two
# version 3s is wrong whether or not anybody is restoring.
class AddUniqueIndexToPackVersions < ActiveRecord::Migration[8.1]
  def up
    duplicates = select_rows(<<~SQL)
      SELECT pack_id, version, count(*)
      FROM pack_versions
      GROUP BY 1, 2
      HAVING count(*) > 1
    SQL

    if duplicates.any?
      raise ActiveRecord::MigrationError, <<~MESSAGE
        pack_versions has #{duplicates.size} duplicate (pack_id, version) pair(s), so the
        unique index cannot be built. The advisory lock in PackVersion#set_version_number has
        not always been there. Dedupe first -- see
        db/migrate/20260104072300_fix_duplicate_pack_npis.rb for the shape of a cleanup pass.

        #{duplicates.first(10).map { |pack_id, version, count| "  pack #{pack_id} version #{version}: #{count} rows" }.join("\n")}
      MESSAGE
    end

    add_index :pack_versions, [:pack_id, :version], unique: true
  end

  def down
    remove_index :pack_versions, [:pack_id, :version]
  end
end
