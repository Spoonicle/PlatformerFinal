class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -900;
    }

    create() {
        // Create a new tilemap game object from the loaded Tiled JSON.
        this.map = this.make.tilemap({ key: "platformer-level-1" });

        // Add a tileset to the map
        // First parameter: name used by Tiled in mapFile.tmj
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("1-bit_tilemap", "tilemap_tiles");

        // Create layers matching the names in mapFile.tmj
        const createLayerSafe = (name) => {
            const layer = this.map.createLayer(name, this.tileset, 0, 0);
            if (!layer) {
                console.warn(`Tilemap layer not found: ${name}`);
                return null;
            }
            layer.setScale(2.0);
            return layer;
        };

        this.backgroundLayer = createLayerSafe("Background");
        this.detailsLayer = createLayerSafe("Details");
        this.groundLayer = createLayerSafe("Ground");
        this.glassLayer = createLayerSafe("Glass");
        this.playerLayer = createLayerSafe("Player");

        // Make it collidable
        if (this.groundLayer) {
            this.groundLayer.setCollisionBetween(1, 1000);
        }

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/4, "tile_0300").setScale(SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Make camera follow the player
        this.cameras.main.startFollow(my.sprite.player);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

    }

    update() {
        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);


            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

        }
    }
}