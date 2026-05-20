class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500; // Lowered to make rolling sluggish, emphasizing the launch
        this.DRAG = 650;  // Increased so the player slows down naturally and stops
        this.physics.world.gravity.y = 1500;
        this.LAUNCH_SPEED = 1200; // Momentum of the blob launch
        this.physics.world.TILE_BIAS = 64; // Increases collision boundary thickness to prevent tunneling
        this.isAiming = false;
        this.hasKey = false;
        this.levelComplete = false;
        this.wasOnGround = false;
    }

    create() {
        // Create a new tilemap game object from the loaded Tiled JSON.
        this.map = this.make.tilemap({ key: "platformer-level-1" });

        // Add a tileset to the map
        // First parameter: name used by Tiled in mapFile.tmj
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("1-bit_tilemap", "tilemap_tiles");

        // Create layers matching the names in mapFile.tmj
        const mapScale = 2.0;
        const createLayerSafe = (name) => {
            const layerData = this.map.layers.find(layer => layer.name === name);
            if (!layerData) {
                console.warn(`Tilemap layer not found: ${name}`);
                return null;
            }

            const layer = this.map.createLayer(name, this.tileset, 0, 0);
            layer.setScale(mapScale);
            return layer;
        };

        this.backgroundLayer = createLayerSafe("Background");
        this.detailsLayer = createLayerSafe("Details");
        this.groundLayer = createLayerSafe("Ground");
        this.glassLayer = createLayerSafe("Glass");
        this.gemsLayer = createLayerSafe("Gems");
        this.playerLayer = createLayerSafe("Player");

        // Make it collidable
        if (this.groundLayer) {
            this.groundLayer.setCollisionBetween(1, 1000);
        }

        // Expand physics world and camera bounds to match the tilemap size (accounting for scale)
        const mapWidth = this.map.widthInPixels * mapScale;
        const mapHeight = this.map.heightInPixels * mapScale;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/4, "tile_0340").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocity(this.LAUNCH_SPEED, this.LAUNCH_SPEED * 1.5); // Prevent infinite gravity acceleration

        // Enable collision handling only if the ground layer exists
        if (this.groundLayer) {
            this.physics.add.collider(my.sprite.player, this.groundLayer);
        }

        // Make camera follow the player
        this.cameras.main.startFollow(my.sprite.player);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.isAiming = false;

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // reset key listener (assigned to R key)
        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        }, this);

        // create new gem group
        this.gems = this.physics.add.group();

        const gemObjectLayer = this.map.getObjectLayer("Gems");
        if (gemObjectLayer && gemObjectLayer.objects.length > 0) {
            gemObjectLayer.objects.forEach(gemObj => {
                let gem = this.gems.create(gemObj.x * mapScale, gemObj.y * mapScale, "tile_0082").setScale(SCALE);
                gem.body.setAllowGravity(false);
            });
        } else if (this.gemsLayer) {
            const gemTiles = [];
            this.gemsLayer.forEachTile(tile => {
                if (tile.index > 0) {
                    gemTiles.push(tile);
                }
            });

            gemTiles.forEach(tile => {
                let gem = this.gems.create(tile.getCenterX() * mapScale, tile.getCenterY() * mapScale, "tile_0082").setScale(SCALE);
                gem.body.setAllowGravity(false);
                this.gemsLayer.removeTileAt(tile.x, tile.y);
            });
        } 

        // if player overlaps with a gem, destroy it
        this.physics.add.overlap(my.sprite.player, this.gems, (player, gem) => {
            gem.destroy();
            this.sound.play("gem_sound");
        });

        this.keys = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();

        const createObjectLayerSprites = (layerName, spriteKey, group) => {
            const objectLayer = this.map.getObjectLayer(layerName);
            if (!objectLayer || objectLayer.objects.length === 0) {
                console.warn(`No object layer named ${layerName}`);
                return;
            }

            objectLayer.objects.forEach(obj => {
                const objectSprite = group.create(obj.x * mapScale, obj.y * mapScale, spriteKey)
                    .setOrigin(0, 1)
                    .setScale(mapScale);

                if (objectSprite.body) {
                    objectSprite.body.setSize(objectSprite.displayWidth, objectSprite.displayHeight);
                    objectSprite.body.setOffset(0, 0);
                }
            });
        };

        createObjectLayerSprites("Key", "tile_0096", this.keys);
        createObjectLayerSprites("Door", "tile_0058", this.doors);

        this.physics.add.overlap(my.sprite.player, this.keys, this.handleKeyPickup, null, this);
        this.physics.add.overlap(my.sprite.player, this.doors, this.handleDoorOverlap, null, this);
    
        // Create the smoke animation if it doesn't already exist
        if (!this.anims.exists('smoke_burst')) {
            this.anims.create({
                key: 'smoke_burst',
                frames: this.anims.generateFrameNumbers('smoke', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Jumping particle effect
        this.jumpEmitter = this.add.particles(0, 0, 'smoke', {
            anim: 'smoke_burst',             // Play the animation on each particle
            lifespan: 800,
            speedX: { min: -20, max: 20 },   // Slight horizontal spread
            speedY: 0,                       // 0 Y speed so it stays exactly where it spawns on the ground
            scale: { start: 0.2, end: 0.01  }, // Shrink the massive 384x384 frames down to pixel-art size
            alpha: { start: 1, end: 0 },     // Fade out over time
            emitting: false                  // Don't emit automatically
        }).setDepth(5);

        // Create the fumacinha sliding/landing animation
        if (!this.anims.exists('fumacinha_anim')) {
            this.anims.create({
                key: 'fumacinha_anim',
                frames: this.anims.generateFrameNumbers('fumacinha', { start: 0, end: 7 }),
                frameRate: 15,
                repeat: 0
            });
        }

        // Landing and sliding particle effect
        this.slideEmitter = this.add.particles(0, 0, 'fumacinha', {
            anim: 'fumacinha_anim',
            lifespan: 500,
            speedX: { min: -30, max: 30 },   // More horizontal spread for sliding
            speedY: { min: -10, max: 0 },    // Slight upward movement
            scale: { start: 0.1, end: 0.1 }, // Slightly larger than jump smoke
            alpha: { start: 0.8, end: 0 },
            emitting: false
        }).setDepth(5);

        this.gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'GAME OVER\nPress R to Restart', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 20 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

        this.instructionText = this.add.text(game.config.width / 4, game.config.height / 4 - 40, 'press space to jump towards your cursor', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5).setDepth(100);
    }

    handleKeyPickup(player, key) {
        if (this.hasKey) {
            return;
        }

        this.hasKey = true;
        key.destroy();
    }

    handleDoorOverlap(player, door) {
        if (this.levelComplete) {
            return;
        }

        if (this.hasKey) {
            this.levelComplete = true;
            this.physics.pause();
            player.setTint(0x88ff88);
            this.gameOverText.setVisible(true);
            this.sound.play("winSound");
        }
    }

    update() {
        // if(cursors.left.isDown) {
        //     // TODO: have the player accelerate to the left
        //     my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
        //     
        //     my.sprite.player.resetFlip();
        //     my.sprite.player.anims.play('walk', true);
        //
        // } else if(cursors.right.isDown) {
        //     // TODO: have the player accelerate to the right
        //     my.sprite.player.body.setAccelerationX(this.ACCELERATION);
        //
        //
        //     my.sprite.player.setFlip(true, false);
        //     my.sprite.player.anims.play('walk', true);
        //
        // } else {
        // TODO: set acceleration to 0 and have DRAG take over
        my.sprite.player.body.setAccelerationX(0);
        my.sprite.player.body.setDragX(this.DRAG);

        if (!my.sprite.player.body.blocked.down) {
            if (my.sprite.player.texture.key !== 'tile_0343') {
                my.sprite.player.setTexture('tile_0343');
            }
        } else if (cursors.space.isDown) {
            if (my.sprite.player.texture.key !== 'tile_0344') {
                my.sprite.player.setTexture('tile_0344');
            }
        } else {
            if (my.sprite.player.texture.key !== 'tile_0340') {
                my.sprite.player.setTexture('tile_0340');
            }
        }

        if (my.sprite.player.body.blocked.down) {
            if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                this.isAiming = true;
            }

            if (Phaser.Input.Keyboard.JustUp(cursors.space) && this.isAiming) {
                let pointer = this.input.activePointer;

                // Ensure the pointer's world coordinates are up to date with the scrolling camera
                pointer.updateWorldPoint(this.cameras.main);

                // Calculate angle between player and pointer's world coordinates
                let angle = Phaser.Math.Angle.Between(my.sprite.player.x, my.sprite.player.y, pointer.worldX, pointer.worldY);

                // Launch the player using trigonometry to apply the velocity vector
                my.sprite.player.body.setVelocity(
                    Math.cos(angle) * this.LAUNCH_SPEED,
                    Math.sin(angle) * this.LAUNCH_SPEED
                );

                // Play random jump sound
                let jumpSound = "pepSound" + Phaser.Math.Between(1, 5);
                this.sound.play(jumpSound);

                // Burst particles right at the player's feet
                this.jumpEmitter.emitParticleAt(my.sprite.player.x, my.sprite.player.body.bottom);

                this.isAiming = false;

                if (this.instructionText) {
                    this.instructionText.destroy();
                    this.instructionText = null;
                }
            }
        }

        let onGround = my.sprite.player.body.blocked.down;

        if (onGround && !this.wasOnGround) {
            // Just landed: Burst 5 particles
            this.slideEmitter.emitParticleAt(my.sprite.player.x, my.sprite.player.body.bottom, 5);

            // Play landing sound
            this.sound.play("player_fall");
        }

        if (onGround && Math.abs(my.sprite.player.body.velocity.x) > 15) {
            // Sliding fast enough: Leave a trail (1 particle per frame)
            this.slideEmitter.emitParticleAt(my.sprite.player.x, my.sprite.player.body.bottom, 1);
        }

        this.wasOnGround = onGround;
    }
}